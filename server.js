const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const applicationSchema = new mongoose.Schema(
  {
    company: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "Full-time",
    },
    location: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      default: "Applied",
    },
    appliedDate: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

const Application = mongoose.model("Application", applicationSchema);

app.get("/", (req, res) => {
  res.json({
    message: "CareerTrack API is running",
  });
});

app.get("/api/applications", async (req, res) => {
  try {
    const applications = await Application.find().sort({
      appliedDate: -1,
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch applications",
    });
  }
});

app.get("/api/applications/:id", async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({
      message: "Unable to fetch application",
    });
  }
});

app.post("/api/applications", async (req, res) => {
  try {
    const { company, role, type, location, status, appliedDate, notes } =
      req.body;

    if (!company || !role) {
      return res.status(400).json({
        message: "Company and role are required",
      });
    }

    const newApplication = await Application.create({
      company,
      role,
      type: type || "Full-time",
      location: location || "",
      status: status || "Applied",
      appliedDate:
        appliedDate || new Date().toISOString().split("T")[0],
      notes: notes || "",
    });

    res.status(201).json(newApplication);
  } catch (error) {
    res.status(500).json({
      message: "Unable to add application",
    });
  }
});

app.put("/api/applications/:id", async (req, res) => {
  try {
    const application = await Application.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json(application);
  } catch (error) {
    res.status(500).json({
      message: "Unable to update application",
    });
  }
});

app.delete("/api/applications/:id", async (req, res) => {
  try {
    const application = await Application.findByIdAndDelete(
      req.params.id
    );

    if (!application) {
      return res.status(404).json({
        message: "Application not found",
      });
    }

    res.json({
      message: "Application deleted",
      application,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete application",
    });
  }
});

const PORT = 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(
        `CareerTrack backend running on http://localhost:${PORT}`
      );
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });