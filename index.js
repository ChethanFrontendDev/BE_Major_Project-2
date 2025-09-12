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

    if (savedSalesAgent) {
      res.status(201).json({
        message: "Sales Agent Added Successfully.",
        salesAgent: savedSalesAgent,
      });
    } else {
      res.status(400).json({ error: "Sales Agent Not Found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to Add Sales Agent." });
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
    const savedLead = await createLead(req.body);

    if (savedLead) {
      res
        .status(201)
        .json({ message: "Lead Added Successfully.", lead: savedLead });
    } else {
      res.status(400).json({ error: "Lead Not Found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to Add Lead." });
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
    const savedComment = await createComments(
      leadId,
      salesAgentId,
      commentText
    );

    if (savedComment) {
      res.status(201).json({
        message: "Comment Added Successfully.",
        comment: savedComment,
      });
    } else {
      res.status(400).json({ error: "Comment Not Found." });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to Add Comment." });
  }
});

const PORT = 6000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
