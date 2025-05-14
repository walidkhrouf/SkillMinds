import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import '../Courses/CreateCourse.css';

const UpdateCourse = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillId, setSkillId] = useState('');
  const [price, setPrice] = useState(0);
  const [sections, setSections] = useState([{ title: '', video: null }]);
  const [skills, setSkills] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/courses/${id}`, {
          params: { userId: currentUser._id }
        });
        const course = response.data.course;
        setTitle(course.title);
        setDescription(course.description || '');
        setSkillId(course.skillId?._id || '');
        setPrice(course.price);
        setSections(course.videos.map((v, i) => ({ title: `Section ${i + 1}`, video: null })));
      } catch {
        setError('Error fetching course');
      }
    };

    const fetchSkills = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses/skills');
        setSkills(response.data);
      } catch {
        setError('Error fetching skills');
      }
    };

    fetchCourse();
    fetchSkills();
  }, [id, currentUser._id]);

  const generateDescription = useCallback(async () => {
    if (!title || !skillId) {
      setError('Please enter a title and select a skill before generating a description');
      return;
    }

    const selectedSkill = skills.find(skill => skill._id === skillId);
    if (!selectedSkill) {
      setError('Selected skill not found');
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Sending request to generate description:', { title, skillName: selectedSkill.name });
      const response = await axios.post('http://localhost:5000/api/courses/generate-description', {
        title,
        skillName: selectedSkill.name
      });
      const generatedDescription = response.data.description;
      setDescription(generatedDescription);
      setError('');
      setSuccess('Description generated successfully!');
    } catch (err) {
      console.error('Error generating description:', err.response?.data);
      setError(err.response?.data.message || 'Failed to generate description. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  }, [title, skillId, skills]);

  useEffect(() => {
    if (autoGenerate && title.trim().length >= 3 && skillId) {
      generateDescription();
    }
  }, [title, skillId, autoGenerate, generateDescription]);

  const handleSectionChange = (index, field, value) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const handleVideoChange = (index, e) => {
    const file = e.target.files[0];
    if (file && !file.type.startsWith('video/')) {
      setError('Only video files are allowed');
      return;
    }
    handleSectionChange(index, 'video', file);
    setError('');
  };

  const addSection = () => {
    setSections([...sections, { title: '', video: null }]);
  };

  const removeSection = (index) => {
    if (sections.length === 1) return;
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser._id) return setError('Please log in to update a course');
    if (!title || !skillId || sections.some(s => !s.title)) {
      return setError('All fields and at least one video section are required');
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('skillId', skillId);
    formData.append('price', price);
    formData.append('userId', currentUser._id);
    sections.forEach((section) => {
      if (section.video) formData.append('videos', section.video);
    });

    try {
      await axios.put(`http://localhost:5000/api/courses/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Course updated successfully!');
      setTimeout(() => navigate('/all-courses'), 2000);
    } catch (err) {
      setError(err.response?.data.message || 'Error updating course');
    }
  };

  return (
    <div className="create-course-container">
      <h2>Update Course</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <form onSubmit={handleSubmit} className="create-course-form">
        <div className="form-group">
        <label>Title:</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          placeholder="Enter course title"
        />
        </div>
        <div className="form-group">
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter course description"
            disabled={isGenerating}
          />
          <div className="description-controls">
            <label>
              <input
                type="checkbox"
                checked={autoGenerate}
                onChange={() => setAutoGenerate(!autoGenerate)}
              />
              Auto-generate description
            </label>
            <button
              type="button"
              className="generate-btn"
              onClick={generateDescription}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Generate Description with AI'}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label>Skill:</label>
          <select value={skillId} onChange={(e) => setSkillId(e.target.value)} required>
            <option value="">Select a skill</option>
            {skills.map((skill) => (
              <option key={skill._id} value={skill._id}>
                {skill.name}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Price:</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            min="0"
            placeholder="Enter price (0 for free)"
          />
        </div>
        {sections.map((section, index) => (
          <div key={index} className="video-section">
            <h3>Section {index + 1}</h3>
            <div className="form-group">
              <label>Section Title:</label>
              <input
                type="text"
                value={section.title}
                onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                required
                placeholder="e.g., Beginning"
              />
            </div>
            <div className="form-group">
              <label>Upload New Video (optional):</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => handleVideoChange(index, e)}
              />
            </div>
            {sections.length > 1 && (
              <button type="button" className="remove-btn" onClick={() => removeSection(index)}>
                Remove Section
              </button>
            )}
          </div>
        ))}
        <button type="button" className="add-section-btn" onClick={addSection}>
          Add Another Section
        </button>
        <button type="submit" className="submit-btn">
          Update Course
        </button>
      </form>
    </div>
  );
};

export default UpdateCourse;