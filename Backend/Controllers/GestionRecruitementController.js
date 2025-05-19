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

    // ✅ Notifications pour le candidat
    await Notification.create({
      userId: application.applicantId,
      type: 'JOB_APPLICATION_STATUS',
      message: `Your application for "${application.jobId.title}" has been ${status}.`
    });

    // ✅ Optionnel : rejeter les autres si besoin, mais on ne ferme pas l'offre
    // if (status === 'accepted') {
    //   const otherApps = await JobApplication.find({
    //     jobId: application.jobId._id,
    //     _id: { $ne: applicationId }
    //   });

    //   for (const other of otherApps) {
    //     if (other.status === 'pending') {
    //       other.status = 'rejected';
    //       await other.save();

    //       await Notification.create({
    //         userId: other.applicantId,
    //         type: 'JOB_APPLICATION_STATUS',
    //         message: `Your application for "${application.jobId.title}" has been rejected.`
    //       });
    //     }
    //   }
    // }

    res.status(200).json({ message: `Application ${status}` });
  } catch (error) {
    console.error('Error updating application status:', error);
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

const isAdmin = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user && user.role === "admin";
  } catch (err) {
    return false;
  }
};
const updateJobOffer = async (req, res) => {
  try {
    const {
      title,
      description,
      experienceLevel,
      jobType,
      location,
      city,
      salaryRange,
      requiredSkills,
      userId,
    } = req.body;

    const jobOffer = await JobOffer.findById(req.params.id);
    if (!jobOffer) return res.status(404).json({ message: 'Job offer not found' });

    // Autorisation : créateur OU admin
    const isOwner = jobOffer.postedBy.toString() === userId;
    const isUserAdmin = await isAdmin(userId);

    if (!isOwner && !isUserAdmin) {
      return res.status(403).json({ message: 'You are not authorized to update this job offer' });
    }

    const updatedJobOffer = await JobOffer.findByIdAndUpdate(
      req.params.id,
      {
        title,
        description,
        experienceLevel,
        jobType,
        location,
        city,
        salaryRange,
        requiredSkills,
      },
      { new: true }
    ).populate('postedBy', 'username');

    const notification = new Notification({
      userId,
      type: 'JOB_OFFER_UPDATED',
      message: `The job offer "${title}" has been updated successfully.`,
    });
    await notification.save();

    res.status(200).json(updatedJobOffer);
  } catch (error) {
    console.error('Error updating job offer:', error);
    res.status(500).json({ message: error.message });
  }
};



const deleteJobOffer = async (req, res) => {
  try {
    const currentUserId = req.query.userId;
    const jobOffer = await JobOffer.findById(req.params.id);
    if (!jobOffer) return res.status(404).json({ message: 'Job offer not found' });

    // Autorisation : admin OU créateur de l'offre
    if (jobOffer.postedBy.toString() !== currentUserId && !(await isAdmin(currentUserId))) {
      return res.status(403).json({ message: 'You can only delete your own job offers' });
    }

    await JobOffer.findByIdAndDelete(req.params.id);

    const notification = new Notification({
      userId: currentUserId,
      type: 'JOB_OFFER_DELETED',
      message: `Your job offer "${jobOffer.title}" has been deleted successfully.`
    });
    await notification.save();

    res.status(200).json({ message: 'Job offer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
    // VÃ©rifie que l'utilisateur existe
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // RÃ©cupÃ¨re les skills depuis UserSkill (et non User)
    const userSkillsDocs = await UserSkill.find({ userId });
    const userSkills = userSkillsDocs.map(skill => skill.skillId.toString());

    // RÃ©cupÃ¨re les offres de job ouvertes
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

const moment = require('moment');

const updateInterviewDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { interviewDate } = req.body;

    if (!interviewDate) {
      return res.status(400).json({ message: 'Interview date is required' });
    }

    const application = await JobApplication.findById(id).populate('jobId').populate('applicantId');
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // ⚠️ Empêcher de fixer plusieurs fois
    if (application.interviewDate) {
      return res.status(400).json({ message: 'Interview date has already been set for this application.' });
    }

    const { meetLink } = req.body;
    application.interviewDate = interviewDate;
    application.interviewConfirmed = 'pending';
     application.meetLink = meetLink;
    
    await application.save();

    // ✅ Formater la date pour l'affichage
    const formattedDate = moment(interviewDate).format('dddd DD MMMM YYYY [at] HH:mm');

    // ✅ Envoyer la notification
    await Notification.create({
      userId: application.applicantId._id,
      type: 'INTERVIEW_DATE_SET', // ⚠️ Ce type doit exister dans le schema Notification
      message: `You have been scheduled for an interview on ${formattedDate} for the job "${application.jobId.title}".`
    });

    res.status(200).json({
      message: 'Interview date saved and notification sent.',
      application
    });
  } catch (error) {
    console.error('Error updating interview date:', error);
    res.status(500).json({ message: error.message });
  }
};
const confirmInterviewStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "confirmed" ou "declined"

  if (!['confirmed', 'declined'].includes(status)) {
    return res.status(400).json({ message: 'Invalid confirmation status' });
  }

  try {
    const application = await JobApplication.findById(id).populate('jobId').populate('applicantId');
    if (!application || !application.interviewDate) {
      return res.status(404).json({ message: 'Application or interview not found' });
    }

    application.confirmedInterview = status;
    await application.save();

    // ✅ Envoyer une notification au recruteur
    const recruiterId = application.jobId.postedBy;
    const jobTitle = application.jobId.title;
    const candidateName = application.applicantId.username;

    const type = status === 'confirmed'
      ? 'INTERVIEW_CONFIRMED_BY_CANDIDATE'
      : 'INTERVIEW_DECLINED_BY_CANDIDATE';

    const message = status === 'confirmed'
      ? `${candidateName} has confirmed the interview for the job "${jobTitle}".`
      : `${candidateName} has declined the interview for the job "${jobTitle}".`;

    await Notification.create({
      userId: recruiterId,
      type,
      message
    });

    res.status(200).json({ message: `Interview ${status}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const getUserInterviewInvites = async (req, res) => {
  try {
    const { userId } = req.params;

    const interviews = await JobApplication.find({
      applicantId: userId,
      status: 'accepted',
      interviewDate: { $ne: null },
      confirmedInterview: { $in: ['pending', 'confirmed'] }  // ✅ Important !
    }).populate('jobId');

    res.status(200).json(interviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFinalDecision = async (req, res) => {
  try {
    const { decision } = req.body;
    const { id } = req.params; // applicationId

    const application = await JobApplication.findById(id).populate('jobId').populate('applicantId');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    if (decision === 'hired') {
      application.status = 'hired';
      application.jobId.status = 'closed';
      await application.jobId.save();
    } else {
      application.status = 'rejected';
    }

    await application.save();

    await Notification.create({
      userId: application.applicantId._id,
      type: 'FINAL_DECISION',
      message: `You have been ${decision} for the job "${application.jobId.title}".`
    });

    res.status(200).json({ message: `Final decision: ${decision}` });
  } catch (error) {
    console.error('Error in final decision:', error);
    res.status(500).json({ message: error.message });
  }
};
const axios = require('axios');

const generateDescription = async (req, res) => {
  const { title } = req.body;

  if (!title || title.length < 4) {
    return res.status(400).json({ message: 'Invalid job title' });
  }

  try {
    const response = await axios.post(
      'https://api.cohere.ai/generate',
      {
        model: "command",
        prompt: `
Rédige une description professionnelle, engageante et structurée d'une offre d'emploi pour un poste intitulé "${title}". 

Inclure :

1. **Les missions principales**  

2. **Le profil recherché (expériences, qualités, compétences)**  

3. **Ce que l'entreprise propose (environnement, avantages, culture)**  

`,

        temperature: 0.7
      },
      {
        headers: {
          Authorization: 'Bearer 04z1kaux1ifXOElHxS68ModqoJyzYeoeYZIs7xE6',
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06'
        }
      }
    );

    const generated = response.data?.generations?.[0]?.text;
    if (!generated) {
      console.error('Réponse inattendue de Cohere:', response.data);
      return res.status(500).json({ message: 'Réponse de l’IA vide ou invalide.' });
    }

    const description = generated.trim();
    res.status(200).json({ description });

  } catch (error) {
    console.error('Erreur Cohere:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Erreur lors de la génération de la description.' });
  }
};
const generateCoverLetter = async (req, res) => {
  const { username, jobId } = req.body;

  try {
    const job = await JobOffer.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const prompt = `Rédige une lettre de motivation professionnelle, personnalisée et motivante pour un candidat nommé ${username} postulant à une offre d'emploi intitulée "${job.title}". Mentionne brièvement son enthousiasme, son intérêt pour le poste, ses compétences générales et sa motivation à rejoindre une entreprise dynamique.`;

    const response = await axios.post(
      'https://api.cohere.ai/generate',
      {
        model: "command",
        prompt,
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: 'Bearer 04z1kaux1ifXOElHxS68ModqoJyzYeoeYZIs7xE6',
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06'
        }
      }
    );

    const coverLetter = response.data?.generations?.[0]?.text?.trim();
    if (!coverLetter) {
      return res.status(500).json({ message: 'Réponse IA vide ou invalide.' });
    }

    res.status(200).json({ coverLetter });
  } catch (error) {
    console.error('Erreur Cohere:', error?.response?.data || error.message);
    res.status(500).json({ message: 'Erreur lors de la génération de la lettre.' });
  }
};


const getCitiesByCountry = async (req, res) => {
  try {
    const { country } = req.body;

    if (!country) {
      return res.status(400).json({ message: 'Country name is required' });
    }

    const response = await axios.post('https://countriesnow.space/api/v0.1/countries/cities', { country });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching cities:', error.message);
    res.status(500).json({ message: 'Failed to fetch cities' });
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
  getRecommendedJobsBySkills,
  updateInterviewDate,
  confirmInterviewStatus,
  getUserInterviewInvites,
  updateFinalDecision,
  generateDescription,
  generateCoverLetter,
  getCitiesByCountry

};