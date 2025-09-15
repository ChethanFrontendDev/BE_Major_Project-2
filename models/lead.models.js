const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Lead name is required"],
  },
  source: {
    type: String,
    required: [true, "Lead source is required"],
    enum: [
      "Website",
      "Referral",
      "Cold Call",
      "Advertisement",
      "Email",
      "Other",
    ],
  },
  salesAgent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesAgent",
    required: [true, "Sales Agent is required"],
  },
  status: {
    type: String,
    enum: ["New", "Contacted", "Qualified", "Proposal Sent", "Closed"],
    default: "New",
    required: true,
  },
  tags: {
    type: [String],
  },
  timeToClose: {
    type: Number,
    required: [true, "Time to Close is required"],
    min: [1, "Time to Close must be a positive number"],
  },
  priority: {
    type: String,
    enum: ["High", "Medium", "Low"],
    default: "Medium",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  closedAt: {
    type: Date,
  },
});

// Middleware to update the `updatedAt` field on each save
leadSchema.pre("save", function (next) {
  this.updatedAt = Date.now();

  // If status is "Closed" then update closedAt
  if (this.isModified("status") && this.status === "Closed") {
    this.closedAt = new Date();
  }

  next();
});

// Pre-findOneAndUpdate middleware for update queries
leadSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Handle both direct and $set updates
  if (!update.$set) {
    update.$set = {};
  }

  // Update updatedAt always
  update.$set.updatedAt = new Date();

  // If status is being set to "Closed", update closedAt
  const status = update.status || update.$set.status;
  if (status === "Closed") {
    update.$set.closedAt = new Date();
  }

  this.setUpdate(update);
  next();
});

module.exports = mongoose.model("Lead", leadSchema);
