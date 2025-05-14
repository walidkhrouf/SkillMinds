const axios = require('axios');
const FormData = require('form-data');
const Tutorial = require("../models/Tutorial");
const TutorialComment = require("../models/TutorialComment");
const TutorialLike = require("../models/TutorialLike");
const mongoose = require("mongoose");
const twilio = require("twilio");

// Twilio credentials (use environment variables for production)
const client = twilio('AC27d7e1709a833aa34c8ec14f6950e7bc', '500fdc24680bc05801b8c551b17a6fff');
const generateImageFromDescription = async (content) => {
  try {
    const apiUrl = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
    
    if (!apiUrl || !apiUrl.startsWith('http')) {
      console.error('❌ Invalid API URL');
      throw new Error('API configuration error');
    }

    const form = new FormData();
    form.append('prompt', content);
    form.append('output_format', 'jpeg');

    const response = await axios.post(
      apiUrl,
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': `Bearer ${process.env.STABILITY_API_KEY}`,
          'Accept': 'image/*'
        },
        responseType: 'arraybuffer'
      }
    );

    return `data:image/jpeg;base64,${Buffer.from(response.data).toString('base64')}`;
    
  } catch (error) {
    console.error("❌ Stability AI Error:", {
      status: error.response?.status,
      message: error.message,
      responseData: error.response?.data?.toString()
    });
    throw new Error('Image generation failed');
  }
};

exports.generateImage = async (req, res) => {
  const { content } = req.body;
  console.log("Received content:", content);
  
  if (!content) {
    return res.status(400).json({ 
      success: false,
      message: "Prompt is required" 
    });
  }

  try {
    const imageUrl = await generateImageFromDescription(content); // Fixed variable name here
    res.json({ 
      success: true,
      imageUrl 
    });
    
  } catch (error) {
    console.error("Full error:", error);
    res.status(500).json({
      success: false,
      message: "Image generation failed",
      error: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};
// Fonction pour générer l'image à partir de la description
// const generateImageFromDescription = async (content) => {
//   try {
//     const response = await axios.post(
//       process.env.IMAGE_API_KEY,  // Utilisation de l'URL de l'API définie dans le fichier .env
//       {
//         prompt: content,  // Le texte pour générer l'image
//         n: 1,  // Nombre d'images à générer
//         size: '1024x1024',  // Taille de l'image
//       },
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.IMAGE_API_KEY}`,  // Utilisation de la clé API de l'environnement
//           'Content-Type': 'application/json',
//         },
//       }
//     );
//     return response.data.data[0].url;  // Retourne l'URL de l'image générée
//   } catch (error) {
//     console.error("Erreur lors de la génération de l'image:", error);
//     throw new Error('Impossible de générer l\'image.');
//   }
// };


// const generateImageFromDescription = async (content) => {
//   try {
//     const apiUrl = "https://api.openai.com/v1/images/generations"; // Removed trailing space
    
//     // Validate the API URL
//     if (!apiUrl || !apiUrl.startsWith('http')) {
//       console.error('❌ IMAGE_API_URL is not a valid URL:', apiUrl);
//       throw new Error('IMAGE_API_URL is missing or invalid.');
//     }

//     console.log('✅ Using image generation API URL:', apiUrl);

//     const response = await axios.post(
//       apiUrl,
//       {
//         prompt: content,
//         n: 1,
//         size: '1024x1024',
//       },
//       {
//         headers: {
//           'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, // Use environment variable
//           'Content-Type': 'application/json',
//         },
//       }
//     );
    
//     if (response.data?.data?.[0]?.url) {
//       return response.data.data[0].url;
//     } else {
//       throw new Error('No image URL found in the API response');
//     }
//   } catch (error) {
//     if (error.response) {
//       console.error("❌ Full error response:", error.response.data);
//     } else {
//       console.error("❌ Error:", error.message);
//     }
//     throw new Error('Unable to generate the image.');
//   }
// };

// exports.generateImage = async (req, res) => {
//   const { content } = req.body;
//   console.log("📥 Received content for image generation:", content);

//   if (!content) {
//     return res.status(400).json({ message: "Content is required to generate an image." });
//   }

//   try {
//     const imageUrl = await generateImageFromDescription(content);
//     res.status(200).json({ imageUrl });
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).json({ 
//       message: "Error during image generation.",
//       error: error.message 
//     });
//   }
// };

// exports.generateImage = async (req, res) => {
//   const { content } = req.body;
//  console.log("aaaaaaa",content);
//   if (!content) {
//     console.log("yassine");
//     return res.status(400).json({ message: "Le contenu est requis pour générer une image." });
//   }

//   try {
//     const imageUrl = await generateImageFromDescription(content);  // Générer l'image depuis la description
//     res.status(200).json({ imageUrl });  // Retourner l'URL de l'image générée
//   } catch (error) {
//     console.error("Erreur lors de la génération de l'image:", error);
//     res.status(500).json({ message: "Erreur lors de la génération de l'image." });
//   }
// };

exports.createTutorial = async (req, res) => {
  const { title, content, category, userId, media } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = new Tutorial({
      title,
      content,
      category,
      authorId: userId,
      media: media ? JSON.parse(media) : [],
    });

    await tutorial.save();

    const populatedTutorial = await Tutorial.findById(tutorial._id).populate("authorId", "username email");

    const message = "A User created a new tutorial Successfully!";
    const toPhoneNumber = "+21694440966";
    const fromPhoneNumber = "+19413901769";

    client.messages
        .create({ body: message, from: fromPhoneNumber, to: toPhoneNumber })
        .then((message) => console.log(`SMS sent: ${message.sid}`))
        .catch((error) => console.error("Error sending SMS:", error));

    res.status(201).json({
      message: "Tutorial created successfully",
      tutorial: populatedTutorial,
    });
  } catch (error) {
    console.error("Error creating tutorial:", error);
    res.status(500).json({ message: "Failed to create tutorial", error: error.message });
  }
};

exports.getAllTutorials = async (req, res) => {
  try {
    const tutorials = await Tutorial.find()
        .populate("authorId", "username email")
        .sort({ createdAt: -1 });
    res.status(200).json(tutorials);
  } catch (error) {
    console.error("Error fetching tutorials:", error);
    res.status(500).json({ message: "Failed to fetch tutorials", error: error.message });
  }
};

exports.getTutorialById = async (req, res) => {
  const { tutorialId } = req.params;

  try {
    const tutorial = await Tutorial.findById(tutorialId).populate("authorId", "username email");
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const comments = await TutorialComment.find({ tutorialId: tutorial._id })
        .populate("userId", "username");
    const likes = await TutorialLike.find({ tutorialId: tutorial._id }).countDocuments();

    res.status(200).json({ tutorial, comments, likes });
  } catch (error) {
    console.error("Error fetching tutorial:", error);
    res.status(500).json({ message: "Failed to fetch tutorial", error: error.message });
  }
};

exports.updateTutorial = async (req, res) => {
  const { tutorialId } = req.params;
  const { title, content, category, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });
    if (tutorial.authorId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to edit this tutorial" });
    }

    tutorial.title = title || tutorial.title;
    tutorial.content = content || tutorial.content;
    tutorial.category = category || tutorial.category;
    await tutorial.save();

    const updatedTutorial = await Tutorial.findById(tutorial._id).populate("authorId", "username email");
    res.status(200).json({ message: "Tutorial updated successfully", tutorial: updatedTutorial });
  } catch (error) {
    console.error("Error updating tutorial:", error);
    res.status(500).json({ message: "Failed to update tutorial", error: error.message });
  }
};

exports.deleteTutorial = async (req, res) => {
  const { tutorialId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });
    if (tutorial.authorId.toString() !== userId) {
      return res.status(403).json({ message: "You are not authorized to delete this tutorial" });
    }

    await Tutorial.deleteOne({ _id: tutorialId });
    await TutorialComment.deleteMany({ tutorialId: tutorial._id });
    await TutorialLike.deleteMany({ tutorialId: tutorial._id });

    res.status(200).json({ message: "Tutorial deleted successfully" });
  } catch (error) {
    console.error("Error deleting tutorial:", error);
    res.status(500).json({ message: "Failed to delete tutorial", error: error.message });
  }
};

exports.likeTutorial = async (req, res) => {
  const { tutorialId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const existingLike = await TutorialLike.findOne({ tutorialId: tutorial._id, userId });
    let likesCount = await TutorialLike.find({ tutorialId: tutorial._id }).countDocuments();

    if (existingLike) {
      await TutorialLike.deleteOne({ _id: existingLike._id });
      likesCount -= 1;
      return res.status(200).json({ message: "Like removed", likes: likesCount });
    }

    const like = new TutorialLike({ tutorialId: tutorial._id, userId });
    await like.save();
    likesCount += 1;

    res.status(200).json({ message: "Tutorial liked", likes: likesCount });
  } catch (error) {
    console.error("Error liking tutorial:", error);
    res.status(500).json({ message: "Failed to like tutorial", error: error.message });
  }
};

exports.addComment = async (req, res) => {
  const { tutorialId } = req.params;
  const { content, userId } = req.body;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required" });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ message: "Comment content is required" });
  }

  try {
    const tutorial = await Tutorial.findById(tutorialId);
    if (!tutorial) return res.status(404).json({ message: "Tutorial not found" });

    const comment = new TutorialComment({ tutorialId: tutorial._id, userId, content });
    await comment.save();

    const populatedComment = await TutorialComment.findById(comment._id).populate("userId", "username");
    res.status(201).json({ message: "Comment added", comment: populatedComment });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment", error: error.message });
  }
};

// Delete a comment (owner only)
exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (!userId || !commentId) {
    return res.status(400).json({ message: "User ID and Comment ID are required" });
  }

  try {
    const comment = await TutorialComment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to delete this comment" });
    }

    await TutorialComment.deleteOne({ _id: commentId });
    res.status(200).json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Error deleting comment:", error.message);
    res.status(500).json({
      message: "Failed to delete comment",
      error: error.message,
    });
  }
};
// Edit a comment (owner only)
exports.editComment = async (req, res) => {
  const { commentId } = req.params;
  const { content, userId } = req.body;

  if (!userId || !content?.trim() || !commentId) {
    return res.status(400).json({ message: "All required fields must be provided" });
  }

  try {
    const comment = await TutorialComment.findById(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    if (comment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized to edit this comment" });
    }

    const badWordCheck = await checkForBadWords(content);
    if (badWordCheck.isBad) {
      return res.status(400).json({
        message: "Comment contains inappropriate language",
        censoredContent: badWordCheck.censoredContent,
      });
    }

    comment.content = content;
    await comment.save();

    const populatedComment = await TutorialComment.findById(comment._id).populate(
      "userId",
      "username"
    );
    res.status(200).json({ message: "Comment updated", comment: populatedComment });
  } catch (error) {
    console.error("Error editing comment:", error.message);
    res.status(500).json({
      message: "Failed to edit comment",
      error: error.message,
    });
  }
};
module.exports = exports;