import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import moment from 'moment';
import { useNavigate } from 'react-router-dom';

const PickInterviewDate = ({ applicationId }) => {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedHour, setSelectedHour] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [meetLink, setMeetLink] = useState(''); // ✅ lien visio
  const [reservedHours, setReservedHours] = useState([]);


  const hours = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

  const handleSubmit = async () => {
    if (!selectedDate || !selectedHour || !meetLink) {
      setError('Please select a date, time and provide a meeting link.');
      return;
    }

    const fullDate = moment(`${moment(selectedDate).format('YYYY-MM-DD')} ${selectedHour}`, 'YYYY-MM-DD HH:mm').toDate();

    try {
      await axios.put(`http://localhost:5000/api/recruitment/applications/${applicationId}/interview-date`, {
        interviewDate: fullDate,
        meetLink
      });

      setSuccess('Interview scheduled and link saved!');
      setError('');
      setTimeout(() => navigate(-1), 2000);
    } catch (err) {
      setError('Error saving interview information.');
    }
  };
  const fetchReservedHours = async (date) => {
    try {
      const formattedDate = moment(date).format('YYYY-MM-DD');
      const res = await axios.get(`http://localhost:5000/api/recruitment/applications/reserved-hours?date=${formattedDate}`);
      setReservedHours(res.data); // ex: ['09:00', '13:00']
    } catch (err) {
      console.error('Error fetching reserved hours:', err);
    }
  };
  

  return (
    <div className="interview-date-container"> <br />
      <h3>📅 Schedule Interview</h3>

      <DatePicker
        selected={selectedDate}
        onChange={(date) => {
          setSelectedDate(date);
          setShowTimePicker(true);
          fetchReservedHours(date); // 👈 Tu as oublié cette ligne !
        }}
        
        minDate={new Date()}
        placeholderText="Select a day"
        className="datepicker" 
      />

      {showTimePicker && (
        <div className="hour-list"> <br />
          <h3><strong>Select Time:</strong></h3>
          <div className="hour-grid">
  {hours.map((hour, index) => {
    const isReserved = reservedHours.includes(hour);

    return (
      <button
        key={hour}
        className={`hour-btn ${selectedHour === hour ? 'selected' : ''}`}
        onClick={() => !isReserved && setSelectedHour(hour)}
        disabled={isReserved}
      >
        {hour}
      </button>
    );
  })}
</div>

        </div>
      )}

      {/* ✅ Input pour Meet Link */}
      <div style={{ marginTop: '15px' ,width:'500px' }}> <br /> <br />
        <label htmlFor="meetLink"><strong>Meeting Link (Google Meet, Zoom...)</strong></label><br />
        <input
          type="text"
          id="meetLink"
          value={meetLink}
          onChange={(e) => setMeetLink(e.target.value)}
          placeholder="https://meet.google.com/xxx-xxxx-xxx"
          style={{ width: '100%', padding: '8px', marginTop: '5px' }}
        />
        <button
  type="button"
  onClick={() => {
    const uniqueId = Math.random().toString(36).substring(2, 12);
    const link = `https://meet.jit.si/interview-${uniqueId}`;
    setMeetLink(link);
  }}
  className="generate-link-btn"
  style={{ marginBottom: '10px' }}
>
  🔗 Générer un lien Meet
</button>

      </div>

      <div style={{ marginTop: '15px' ,width:'700px'}}>
        <button onClick={handleSubmit} className="confirm-btn">Valider</button>
        <button onClick={() => {
          setSelectedDate(null);
          setSelectedHour('');
          setShowTimePicker(false);
          setMeetLink('');
        }} className="cancel-btn">Annuler</button>
      </div>

      {success && <p className="success-msg">{success}</p>}
      {error && <p className="error-msg">{error}</p>}
    </div>
  );
};

export default PickInterviewDate;
