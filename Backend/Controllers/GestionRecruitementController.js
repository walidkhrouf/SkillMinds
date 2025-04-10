const JobOffer = require('../models/JobOffer');
const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');
const User = require('../models/User');
const UserSkill = require('../models/UserSkill');


const createJobApplication = async (req, res) => {
  try {
    const { applicantId, coverLetter, jobId } = req.body;
    const resumeFile = req.file;

    if (!applicantId || !coverLetter || !jobId || !resumeFile) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const jobExists = await JobOffer.findById(jobId);
    if (!jobExists) return res.status(400).json({ message: 'Invalid jobId' });

    const resume = {
      data: resumeFile.buffer,
      contentType: resumeFile.mimetype,
      filename: resumeFile.originalname,
      length: resumeFile.size
    };

    const newApplication = new JobApplication({
      jobId,
      applicantId,
      coverLetter,
      resume
    });

    await newApplication.save();

    const applicantNotification = new Notification({
      userId: applicantId,
      type: 'JOB_APPLICATION_STATUS',
      message: `Your application for "${jobExists.title}" has been submitted.`
    });
    await applicantNotification.save();

    const posterNotification = new Notification({
      userId: jobExists.postedBy,
      type: 'JOB_APPLICATION_RECEIVED',
      message: `A new application has been received for your job "${jobExists.title}".`
    });
    await posterNotification.save();

    res.status(201).json({ message: 'Application submitted successfully', application: newApplication });
  } catch (error) {
    console.error('Error in createJobApplication:', error);
    res.status(500).json({ message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;

  try {
    const application = await JobApplication.findById(applicationId).populate('jobId');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.status = status;
    await application.save();

    if (status === 'accepted') {
      await JobOffer.findByIdAndUpdate(application.jobId._id, { status: 'closed' });

      const otherApps = await JobApplication.find({
        jobId: application.jobId._id,
        _id: { $ne: applicationId }
      });

      for (const other of otherApps) {
        if (other.status === 'pending') {
          other.status = 'rejected';
          await other.save();

          await Notification.create({
            userId: other.applicantId,
            type: 'JOB_APPLICATION_STATUS',
            message: `Your application for "${application.jobId.title}" has been rejected.`
          });
        }
      }
    }

    await Notification.create({
      userId: application.applicantId,
      type: 'JOB_APPLICATION_STATUS',
      message: `Your application for "${application.jobId.title}" has been ${status}.`
    });

    res.status(200).json({ message: `Application ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createJobOffer = async (req, res) => {
  try {
    const { title, description, experienceLevel, jobType, location, city, salaryRange ,requiredSkills} = req.body;
    const postedBy = req.body.postedBy;

    if (!title || !description || !experienceLevel || !jobType || !postedBy) {
      return res.status(400).json({ message: 'Required fields are missing' });
    }

    const newJobOffer = new JobOffer({
      title,
      description,
      experienceLevel,
      jobType,
      location,
      city,
      salaryRange,
      requiredSkills,
      postedBy
    });

    await newJobOffer.save();

    const notification = new Notification({
      userId: postedBy,
      type: 'JOB_OFFER_CREATED',
      message: `Your job offer "${title}" has been created successfully.`
    });
    await notification.save();

    res.status(201).json(newJobOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllJobOffers = async (req, res) => {
  try {
    const jobOffers = await JobOffer.find().populate('postedBy', 'username');
    res.status(200).json(jobOffers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getJobOfferById = async (req, res) => {
  try {
    const jobOffer = await JobOffer.findById(req.params.id).populate('postedBy', 'username');
    if (!jobOffer) return res.status(404).json({ message: 'Job offer not found' });

    const currentUserId = req.query.userId;
    if (currentUserId && jobOffer.postedBy._id.toString() === currentUserId) {
      const applications = await JobApplication.find({ jobId: jobOffer._id })
        .populate('applicantId', 'username email');
      return res.status(200).json({ jobOffer, applications });
    }

    res.status(200).json({ jobOffer });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateJobOffer = async (req, res) => {
  try {
    const { title, description, experienceLevel, jobType, location, city,salaryRange,requiredSkills } = req.body;
    const currentUserId = req.body.userId;

    const jobOffer = await JobOffer.findById(req.params.id);
    if (!jobOffer) return res.status(404).json({ message: 'Job offer not found' });
    if (jobOffer.postedBy.toString() !== currentUserId) {
      return res.status(403).json({ message: 'You can only update your own job offers' });
    }

    const updatedJobOffer = await JobOffer.findByIdAndUpdate(
      req.params.id,
      { title, description, experienceLevel, jobType, location, city, salaryRange,requiredSkills },
      { new: true }
    ).populate('postedBy', 'username');

    const notification = new Notification({
      userId: currentUserId,
      type: 'JOB_OFFER_UPDATED',
      message: `Your job offer "${title}" has been updated successfully.`
    });
    await notification.save();

    res.status(200).json(updatedJobOffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteJobOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const role = req.query.role; // Expect role from query parameter

    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete job offers' });
    }

    const jobOffer = await JobOffer.findByIdAndDelete(id);
    if (!jobOffer) {
      return res.status(404).json({ message: 'Job offer not found' });
    }

    await Notification.create({
      userId: jobOffer.postedBy,
      type: 'JOB_OFFER_DELETED',
      message: `Your job offer "${jobOffer.title}" has been deleted successfully.`,
    });

    res.status(200).json({ message: 'Job offer deleted successfully' });
  } catch (error) {
    console.error('Error deleting job offer:', error);
    res.status(500).json({ message: 'Server error while deleting job offer' });
  }
};

const getAllJobApplications = async (req, res) => {
  try {
    const currentUserId = req.query.userId;
    const jobOffers = await JobOffer.find({ postedBy: currentUserId });
    const jobIds = jobOffers.map(job => job._id);

    const applications = await JobApplication.find({ jobId: { $in: jobIds } })
      .populate('jobId', 'title')
      .populate('applicantId', 'username email');
    res.status(200).json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


const getRecommendedJobsBySkills = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Vérifie que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Récupère les skills depuis UserSkill (et non User)
    const userSkillsDocs = await UserSkill.find({ userId });
    const userSkills = userSkillsDocs.map(skill => skill.skillId.toString());

    // Récupère les offres de job ouvertes
    const allJobs = await JobOffer.find({ status: { $ne: 'closed' } });

    // Filtre les jobs dont requiredSkills matchent avec les skills du user
    const matchedJobs = allJobs.filter(job => {
      if (!Array.isArray(job.requiredSkills)) return false;
      const matched = job.requiredSkills.filter(skill =>
        userSkills.includes(skill.toString())
      );
      return matched.length > 0;
    });

    res.status(200).json(matchedJobs);
  } catch (error) {
    console.error('Error in AI job recommendation:', error);
    res.status(500).json({ message: 'Error fetching recommended jobs' });
  }
};


module.exports = {
  createJobOffer,
  getAllJobOffers,
  getJobOfferById,
  updateJobOffer,
  deleteJobOffer,
  createJobApplication,
  getAllJobApplications,
  updateApplicationStatus,
  getRecommendedJobsBySkills
};
