import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./GroupMembers.css";

const GroupMembers = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [message, setMessage] = useState("");
  const jwtToken = localStorage.getItem("jwtToken");

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const membersResponse = await axios.get(
          `http://localhost:5000/api/groups/${groupId}/members`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );
        setMembers(membersResponse.data.members || []);

        const groupResponse = await axios.get(
          `http://localhost:5000/api/groups/all`,
          {
            headers: { Authorization: `Bearer ${jwtToken}` },
          }
        );
        const group = groupResponse.data.find((g) => g._id === groupId);
        if (group) {
          setGroupName(group.name);
        } else {
          setMessage("Group not found.");
        }
      } catch (err) {
        setMessage(err.response?.data?.message || "Failed to load members.");
      }
    };

    fetchMembers();
  }, [groupId, jwtToken]);

  const handleRemoveMember = async (memberId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/groups/${groupId}/members/${memberId}`,
        {
          headers: { Authorization: `Bearer ${jwtToken}` },
        }
      );
      setMembers(members.filter((member) => member.userId !== memberId));
      setMessage("Member removed successfully.");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to remove member.");
    }
  };

  const handleBack = () => {
    navigate("/groups");
  };

  return (
    <div className="group-members-container">
      <div className="group-members-header">
        <h1>Members of {groupName || "Group"}</h1>
        <button className="back-button" onClick={handleBack}>
          Back to Groups
        </button>
      </div>
      {message && <div className="message-box">{message}</div>}
      <div className="members-grid">
        {members.length > 0 ? (
          members.map((member) => (
            <div key={member.userId} className="member-card">
              <div className="member-info">
                <span className="member-name">
                  {member.username || "Unknown User"}
                </span>
              </div>
              <button
                className="remove-button"
                onClick={() => handleRemoveMember(member.userId)}
              >
                Remove
              </button>
            </div>
          ))
        ) : (
          <p className="no-members">No members in this group yet.</p>
        )}
      </div>
    </div>
  );
};

export default GroupMembers;