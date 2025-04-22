import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Back from "../common/back/Back";
import "./groupStyles.css";

const GroupRequests = () => {
  const { groupId } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const fetchRequests = async () => {
    const jwtToken = localStorage.getItem("jwtToken");
    try {
      const response = await axios.get(`http://localhost:5000/api/groups/${groupId}/requests`, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setRequests(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load requests.");
      if (err.response?.status === 401) navigate("/signin");
      if (err.response?.status === 403) navigate(`/groups/${groupId}`);
      setLoading(false);
    }
  };

  useEffect(() => {
    const jwtToken = localStorage.getItem("jwtToken");
    if (!jwtToken) {
      navigate("/signin");
      return;
    }
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, [groupId, navigate]);

  const handleAccept = async (requestId) => {
    const jwtToken = localStorage.getItem("jwtToken");
    try {
      await axios.put(`http://localhost:5000/api/groups/${groupId}/request/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      setToastMessage("Request accepted.");
    } catch (err) {
      setToastMessage(err.response?.data?.message || "Failed to accept request.");
    }
  };

  const handleReject = async (requestId) => {
    const jwtToken = localStorage.getItem("jwtToken");
    try {
      await axios.put(`http://localhost:5000/api/groups/${groupId}/request/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      setRequests((prev) => prev.filter((r) => r._id !== requestId));
      setToastMessage("Request rejected.");
    } catch (err) {
      setToastMessage(err.response?.data?.message || "Failed to reject request.");
    }
  };

  if (loading) return <p>Loading requests...</p>;
  if (error) return <p className="group-form__error">{error}</p>;

  return (
    <>
      <Back title="Group Join Requests" />
      <section className="group-section">
        <div className="group-container">
          <div className="group-grid">
            {requests.length === 0 ? (
              <p className="group-no-content">No pending requests.</p>
            ) : (
              requests.map((request) => (
                <div className="group-card" key={request._id}>
                  <div className="group-card__content">
                    <h3 className="group-card__title">{request.userId.username}</h3>
                    <p className="group-card__description">
                      Requested to join on {new Date(request.createdAt).toLocaleString()}
                    </p>
                    <div className="group-card__actions">
                      <button className="group-button" onClick={() => handleAccept(request._id)}>
                        Accept
                      </button>
                      <button className="group-button group-card__delete-btn" onClick={() => handleReject(request._id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      {toastMessage && <div className="toast-message">{toastMessage}</div>}
    </>
  );
};

export default GroupRequests;