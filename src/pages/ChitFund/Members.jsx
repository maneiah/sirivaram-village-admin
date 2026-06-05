import React, { useState } from 'react';
import './ChitFund.css';

const Members = () => {
  const [memberType, setMemberType] = useState('Village member');

  return (
    <div className="grid2" style={{marginBottom:'20px'}}>
      <div className="card" style={{marginBottom:0}}>
        <div className="card-head">
          <div className="card-title">Add Member</div>
        </div>
        
        <div className="field">
          <label className="label">Group <span>*</span></label>
          <select><option>Mani Chit</option><option>Village Chit B</option></select>
        </div>
        
        <div className="grid2">
          <div className="field">
            <label className="label">Full name <span>*</span></label>
            <input type="text" placeholder="Ravi Kumar" />
          </div>
          <div className="field">
            <label className="label">Mobile <span>*</span></label>
            <input type="tel" placeholder="9876543210" />
          </div>
        </div>
        
        <div className="grid2">
          <div className="field">
            <label className="label">UPI / PhonePe / GPay</label>
            <input type="text" placeholder="9876543210@gpay" />
          </div>
          <div className="field">
            <label className="label">Member type</label>
            <select value={memberType} onChange={(e) => setMemberType(e.target.value)}>
              <option>Village member</option>
              <option>Outside member</option>
            </select>
          </div>
        </div>
        
        {memberType === 'Outside member' && (
          <div className="field">
            <label className="label">Join fee paid?</label>
            <select><option>Yes</option><option>No</option></select>
          </div>
        )}
        
        <div className="btn-row">
          <button className="btn btn-gold">Add Member</button>
          <button className="btn btn-outline">Reset</button>
        </div>
      </div>

      <div className="card" style={{marginBottom:0}}>
        <div className="card-head">
          <div className="card-title">Members — Mani Chit</div>
          <button className="btn btn-outline btn-sm">Filter ▾</button>
        </div>

        <div className="member-row-item">
          <div className="av av-a">RK</div>
          <div className="member-info">
            <div className="member-name">Ravi Kumar</div>
            <div className="member-sub">9876543210 · 9876543210@gpay</div>
          </div>
          <span className="badge badge-gold">Winner</span>
        </div>
        <div className="member-row-item">
          <div className="av av-b">SR</div>
          <div className="member-info">
            <div className="member-name">Suresh Reddy</div>
            <div className="member-sub">9876543211 · 9876543211@gpay</div>
          </div>
          <span className="badge badge-blue">Witness</span>
        </div>
        <div className="member-row-item">
          <div className="av av-c">MR</div>
          <div className="member-info">
            <div className="member-name">Mahesh Rao</div>
            <div className="member-sub">9876543212 · 9876543212@gpay</div>
          </div>
          <span className="badge badge-blue">Witness</span>
        </div>
        <div className="member-row-item">
          <div className="av av-d">PK</div>
          <div className="member-info">
            <div className="member-name">Prakash Kumar</div>
            <div className="member-sub">9876543213 · Outside member</div>
          </div>
          <span className="badge badge-green">Active</span>
        </div>
      </div>
    </div>
  );
};

export default Members;
