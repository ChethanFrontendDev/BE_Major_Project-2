const SalesAgent = require("./models/salesAgent.models");
const Lead = require("./models/lead.models");
const Comment = require("./models/comment.models");

const { initializeDatabse } = require("./db/db.connect");
const express = require("express");
const app = express();

const cors = require("cors");
const { default: mongoose } = require("mongoose");
const { error } = require("console");
const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

initializeDatabse();

// !POST Sales Agent
async function createSalesAgent(agentDetails) {
  try {
    const newSalesAgent = new SalesAgent(agentDetails);
    const saveSalesAgent = await newSalesAgent.save();
    return saveSalesAgent;
  } catch (error) {
    throw error;
  }
}
app.post("/agents", async (req, res) => {
  try {
    const savedSalesAgent = await createSalesAgent(req.body);

    // 201: created
    if (savedSalesAgent) {
      res.status(201).json({
        message: "Sales Agent Added Successfully.",
        salesAgent: savedSalesAgent,
      });
    }
  } catch (error) {
    // 400 bad request: validation error
    if (error.name === "ValidationError") {
      const field = Object.keys(error.errors)[0];
      const message = error.errors[field].message;

      return res.status(400).json({
        error: `Invalid Input: '${field}' is required.`,
        details: message,
      });
    }

    // 409 conflict: duplicate email
    if (error.code === 11000 && error.keyValue && error.keyValue.email) {
      return res.status(409).json({
        error: `Sales agent with email ${error.keyValue.email} already exists.`,
      });
    }

    // 500 internal server error
    res.status(500).json({ error: "Server Error: Failed to Add Sales Agent." });
  }
});
// !GET Sales Agent
async function readAllAgents() {
  try {
    const salesAgents = await SalesAgent.find();
    return salesAgents;
  } catch (error) {
    throw error;
  }
}
app.get("/agents", async (req, res) => {
  try {
    const readSalesAgents = await readAllAgents();

    if (readSalesAgents.length !== 0) {
      res.json(readSalesAgents);
    } else {
      res.status(404).json({ error: "Sales Agents Not Found." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ error: "Server Error: Failed to fetch sales agents." });
  }
});

// !POST Leads
async function createLead(LeadData) {
  try {
    const newLead = new Lead(LeadData);
    const saveLead = await newLead.save();
    return saveLead;
  } catch (error) {
    throw error;
  }
}
app.post("/leads", async (req, res) => {
  try {
    const { salesAgent } = req.body;
    // 404 not found: check if sales agent object exists.
    const salesAgentExists = await SalesAgent.findById(salesAgent);
    if (!salesAgentExists) {
      return res
        .status(404)
        .json({ error: `Sales agent with ID '${salesAgent}' not found.` });
    }
    // 201
    const savedLead = await createLead(req.body);
    if (savedLead) {
      res
        .status(201)
        .json({ message: "Lead Added Successfully.", lead: savedLead });
    }
  } catch (error) {
    // 400
    if (error.name === "ValidationError") {
      const field = Object.keys(error.errors)[0];
      const message = error.errors[field].message;
      return res.status(400).json({
        error: `Invalid Input: '${field}' is required.`,
        details: message,
      });
    }
    // 500
    res.status(500).json({ error: "Server Error: Failed to Add Lead." });
  }
});
// !UPDATE Leads
async function updateLeadById(leadId, dataToUpdate) {
  try {
    const updateLead = await Lead.findByIdAndUpdate(leadId, dataToUpdate, {
      new: true,
      runValidators: true,
    });
    return updateLead;
  } catch (error) {
    throw error;
  }
}
app.put("/leads/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updatedLeadData = req.body;

    // Validate: valid mongodb object id or not
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Lead Id Format" });
    }

    // perform the update
    const updatedLead = await updateLeadById(id, updatedLeadData);
    res.status(200).json({
      message: "Lead Updated Successfully.",
      lead: updatedLead,
    });
  } catch (error) {
    // 400
    if (error.name === "ValidationError") {
      const field = Object.keys(error.errors)[0];
      const message = error.errors[field].message;

      return res.status(400).json({
        error: `Invalid Input '${field}' is required.`,
        details: message,
      });
    }
    // 500
    res.status(500).json({ error: "Server Error: Failed to update lead." });
  }
});

// !GET Leads
async function readLeads(query) {
  try {
    const filter = {};

    // optional filter
    if (query.salesAgent) filter.salesAgent = query.salesAgent;
    if (query.status) filter.status = query.status;
    if (query.tags) filter.tags = query.tags;
    if (query.source) filter.source = query.source;

    // if no filter provided, then empty object passed.
    const leads = await Lead.find(filter).populate("salesAgent");
    return leads;
  } catch (error) {
    throw error;
  }
}
app.get("/leads", async (req, res) => {
  try {
    const filteredLeads = await readLeads(req.query);

    if (filteredLeads.length !== 0) {
      res.json(filteredLeads);
    } else {
      res.status(404).json({ error: "Leads Not Found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error: Failed to Fetch Leads." });
  }
});
// !GET Report (Leads closed last week)
async function readClosedLeads(status) {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCHours(0, 0, 0, 0); // Reset to start of today
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7); // Go back 7 days

    const readLeads = await Lead.find({ closedAt: { $gte: sevenDaysAgo } });
    return readLeads;
  } catch (error) {
    throw error;
  }
}
app.get("/report/last-week", async (req, res) => {
  try {
    const readLeadsByClosedAt = await readClosedLeads();

    if (readLeadsByClosedAt.length !== 0) {
      res.json(readLeadsByClosedAt);
    } else {
      res.status(404).json({ error: "Leads Not Found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error: Failed to Fetch Leads." });
  }
});
// !GET Total leads in pipeline
async function readTotalLeadsInPipeline() {
  try {
    const readPipeline = await Lead.countDocuments({
      status: { $ne: "Closed" },
    });
    return readPipeline;
  } catch (error) {
    throw error;
  }
}
app.get("/report/pipeline", async (req, res) => {
  try {
    const readLeadsInPipeline = await readTotalLeadsInPipeline();

    res.status(200).json({
      totalLeadsInPipeline: readLeadsInPipeline,
    });
  } catch (error) {
    res.status(500).json({ error: "Server Error: Failed to Fetch Leads." });
  }
});

// !POST Comments
async function createComments(leadId, salesAgentId, commentText) {
  try {
    const newComment = new Comment({
      lead: leadId,
      author: salesAgentId,
      commentText,
    });
    const saveComment = await newComment.save();
    return saveComment;
  } catch (error) {
    throw error;
  }
}
app.post("/leads/:id/comments", async (req, res) => {
  try {
    const { commentText, salesAgentId } = req.body;
    const leadId = req.params.id;
    // 404
    const leadExists = await Lead.findById(leadId);
    if (!leadExists) {
      res.status(404).json({ error: `Lead with ID '${leadId}' not found.` });
    }
    const savedComment = await createComments(
      leadId,
      salesAgentId,
      commentText
    );
    // 201
    if (savedComment) {
      res.status(201).json({
        message: "Comment Added Successfully.",
        comment: savedComment,
      });
    }
  } catch (error) {
    // 500
    res.status(500).json({ error: "Failed to Add Comment." });
  }
});
// !GET Comments
async function readAllComments(lead) {
  try {
    const readComments = await Comment.find({ lead }).populate("author");
    return readComments;
  } catch (error) {
    throw error;
  }
}
app.get("/leads/:id/comments", async (req, res) => {
  try {
    const comments = await readAllComments(req.params.id);

    if (comments.length !== 0) {
      res.json(comments);
    } else {
      res.status(404).json({ error: "No comments found for this lead." });
    }
  } catch (error) {
    res.status(500).json({ error: "Server Error: Failed to fetch comments." });
  }
});

const PORT = 6000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
