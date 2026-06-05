import React, { useState } from 'react';
import './ChitFund.css';

const Groups = () => {
  const [formData, setFormData] = useState({
    groupName: 'Mani Chit',
    startDate: '2026-06-02',
    duration: 12,
    joinFee: 3000,
    adminUpi: 'sirivaram@ybl',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="grid2" style={{marginBottom:'20px'}}>
      <div className="card" style={{marginBottom:0}}>
        <div className="card-head">
          <div className="card-title">Create Group</div>
        </div>
        
        <div className="field">
          <label className="label">Group name <span>*</span></label>
          <input type="text" placeholder="e.g. Mani Chit" name="groupName" value={formData.groupName} onChange={handleChange} />
        </div>
        
        <div className="grid2">
          <div className="field">
            <label className="label">Start date <span>*</span></label>
            <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label">Duration (months)</label>
            <input type="number" name="duration" value={formData.duration} onChange={handleChange} />
          </div>
        </div>
        
        <div className="grid2">
          <div className="field">
            <label className="label">Join fee (outsiders ₹)</label>
            <input type="number" name="joinFee" value={formData.joinFee} onChange={handleChange} />
          </div>
          <div className="field">
            <label className="label">Admin UPI ID <span>*</span></label>
            <input type="text" placeholder="sirivaram@ybl" name="adminUpi" value={formData.adminUpi} onChange={handleChange} />
          </div>
        </div>
        
        <div className="alert alert-gold">
          <span className="alert-icon">ℹ</span>
          <div>createdByAdminId and status set automatically by server.</div>
        </div>
        
        <div className="btn-row">
          <button className="btn btn-gold">Create Group</button>
          <button className="btn btn-outline">Reset</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:0}}>
        <div className="card-head">
          <div className="card-title">All Groups</div>
          <span className="badge badge-gray">3 groups</span>
        </div>
        
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Members</th>
                <th>Started</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><b>Mani Chit</b></td>
                <td>6</td>
                <td>Jun 2026</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td><b>Village Chit B</b></td>
                <td>8</td>
                <td>Jan 2026</td>
                <td><span className="badge badge-green">Active</span></td>
              </tr>
              <tr>
                <td><b>Village Chit A</b></td>
                <td>4</td>
                <td>Mar 2025</td>
                <td><span className="badge badge-gray">Closed</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Groups;
