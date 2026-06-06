import React, { useState } from 'react';
import './ChitFund.css';

const Dashboard = () => {
  const [activeScreen, setActiveScreen] = useState('dashboard');

  const navTo = (page) => {
    setActiveScreen(page);
  };

  return (
    <div className="chit-fund-container">
      <style>{require('./ChitFund.css')}</style>
      
      {/* Dashboard Screen */}
      {activeScreen === 'dashboard' && (
        <div className="chit-screen active">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-label">Total Groups</div>
              <div className="stat-val">3</div>
              <div className="stat-sub">Active chit groups</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Members</div>
              <div className="stat-val">18</div>
              <div className="stat-sub">Across all groups</div>
            </div>
            <div className="stat-card gold">
              <div className="stat-label">Pending Payouts</div>
              <div className="stat-val">2</div>
              <div className="stat-sub">Awaiting repayment</div>
            </div>
            <div className="stat-card green">
              <div className="stat-label">Paid This Month</div>
              <div className="stat-val">1</div>
              <div className="stat-sub">Completed cycles</div>
            </div>
          </div>

          <div className="grid2">
            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Active Cycles</div>
                  <div className="card-sub">Ongoing chit draws</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navTo('cycles')}>View all</button>
              </div>

              <div className="dash-cycle">
                <div className="dash-cycle-no">1</div>
                <div className="dash-cycle-info">
                  <div className="dash-cycle-name">Mani Chit — Ravi Kumar</div>
                  <div className="dash-cycle-sub">Due: 30 Jun 2026</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="dash-cycle-amount">₹50,000</div>
                  <span className="badge badge-amber">Payout Pending</span>
                </div>
              </div>

              <div className="dash-cycle">
                <div className="dash-cycle-no">2</div>
                <div className="dash-cycle-info">
                  <div className="dash-cycle-name">Village Chit B — Suresh</div>
                  <div className="dash-cycle-sub">Due: 15 Aug 2026</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="dash-cycle-amount">₹75,000</div>
                  <span className="badge badge-gold">Drawn</span>
                </div>
              </div>

              <div className="dash-cycle">
                <div className="dash-cycle-no">3</div>
                <div className="dash-cycle-info">
                  <div className="dash-cycle-name">Mani Chit — Mahesh Rao</div>
                  <div className="dash-cycle-sub">Due: 01 Jan 2027</div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="dash-cycle-amount">₹50,000</div>
                  <span className="badge badge-green">Paid ✓</span>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-head">
                <div>
                  <div className="card-title">Reminder Status</div>
                  <div className="card-sub">Today's scheduler activity</div>
                </div>
                <button className="btn btn-outline btn-sm" onClick={() => navTo('reminders')}>View all</button>
              </div>

              <div className="timeline">
                <div className="tl-item">
                  <div className="tl-dot green"></div>
                  <div className="tl-title">Ravi Kumar — Reminder 1 sent</div>
                  <div className="tl-sub">Mani Chit, Cycle 1 · 11:00 PM</div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot amber"></div>
                  <div className="tl-title">Suresh Babu — Reminder 3 sent</div>
                  <div className="tl-sub">Village Chit B, Cycle 2 · 11:00 PM</div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot red"></div>
                  <div className="tl-title">Witnesses notified — Ramesh</div>
                  <div className="tl-sub">Village Chit A, Cycle 1 · 11:00 PM</div>
                </div>
                <div className="tl-item">
                  <div className="tl-dot gold"></div>
                  <div className="tl-title">Mahesh Rao — Paid ✓</div>
                  <div className="tl-sub">Mani Chit, Cycle 3 · 3:45 PM</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
