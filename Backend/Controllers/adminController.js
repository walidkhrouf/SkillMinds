const Skill = require('../models/Skill');

exports.addSkill = async (req, res) => {
  try {
    const { name, category, description, tags } = req.body;
    if (!name || !category || !description) {
      return res.status(400).json({ message: "Name, category, and description are required." });
    }
    const newSkill = new Skill({ name, category, description, tags: tags || [] });
    const savedSkill = await newSkill.save();
    return res.status(201).json(savedSkill);
  } catch (error) {
    console.error("Error adding skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getSkillCategories = (req, res) => {
  try {
    const categories = Skill.schema.path('category').options.enum;
    return res.json(categories);
  } catch (error) {
    console.error("Error retrieving categories:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.getAllSkills = async (req, res) => {
  try {
    const skills = await Skill.find();
    return res.json(skills);
  } catch (error) {
    console.error("Error fetching skills:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};


exports.getSkillById = async (req, res) => {
  const { id } = req.params;
  try {
    const skill = await Skill.findById(id);
    if (!skill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    res.status(200).json(skill);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving skill", error: error.message });
  }
};


exports.deleteSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Skill.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Skill not found" });
    }
    return res.json({ message: "Skill deleted successfully" });
  } catch (error) {
    console.error("Error deleting skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.updateSkill = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, description, tags } = req.body;
    const updatedSkill = await Skill.findByIdAndUpdate(
      id,
      { name, category, description, tags: tags || [] },
      { new: true }
    );
    if (!updatedSkill) {
      return res.status(404).json({ message: "Skill not found" });
    }
    return res.json(updatedSkill);
  } catch (error) {
    console.error("Error updating skill:", error);
    return res.status(500).json({ message: "Server Error", error: error.message });
  }
};
