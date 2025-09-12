const SalesAgent = require("./models/salesAgent.models");
const Lead = require("./models/lead.models");
const Comment = require("./models/comment.models");

const { initializeDatabse } = require("./db/db.connect");
const express = require("express");
const app = express();

const cors = require("cors");
const corsOptions = {
  origin: "*",
  credentials: true,
};
app.use(cors(corsOptions));

app.use(express.json());

initializeDatabse();

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

const PORT = 6000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
