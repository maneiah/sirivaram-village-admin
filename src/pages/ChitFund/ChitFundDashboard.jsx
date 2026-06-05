import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import './ChitFund.css';

const ChitFundDashboard = () => {
  const [searchParams] = useSearchParams();
  const [activePage, setActivePage] = useState('dashboard');

  useEffect(() => {
    const page = searchParams.get('page') || 'dashboard';
    setActivePage(page);
  }, [searchParams]);

  const nav = (page) => {
    setActivePage(page);
  };

  return (
    <div className="chit-fund-container">
      <style>{`
        :root {
          --bg: #F5F2EC;
          --surface: #FFFDF8;
          --surface2: #F0EDE5;
          --border: #E2DDD3;
          --border2: #D0CAC0;
          --text: #1A1712;
          --text2: #6B6456;
          --text3: #A09890;
          --gold: #B8860B;
          --gold-light: #FFF8E6;
          --gold-border: #E8D080;
          --green: #2D6A4F;
          --green-light: #EAF4EE;
          --green-border: #A8D5B8;
          --red: #8B2020;
          --red-light: #FCEAEA;
          --red-border: #E8A8A8;
          --blue: #1A3A5C;
          --blue-light: #EAF0F8;
          --blue-border: #A8C0D8;
          --amber: #7A4A00;
          --amber-light: #FFF3DC;
          --amber-border: #E8C870;
          --radius: 10px;
          --radius-sm: 6px;
          --shadow: 0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04);
          --shadow-lg: 0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06);
        }

        .chit-fund-container {
          background: var(--bg);
          color: var(--text);
          min-height: 100vh;
          font-size: 14px;
          line-height: 1.5;
        }
      `}</style>

      {/* Main Content */}
      <div className="chit-content">
        {/* Dashboard */}
        {activePage === 'dashboard' && <DashboardScreen nav={nav} />}
        {activePage === 'groups' && <GroupsScreen nav={nav} />}
        {activePage === 'members' && <MembersScreen nav={nav} />}
        {activePage === 'cycles' && <CyclesScreen nav={nav} />}
        {activePage === 'workflow' && <WorkflowScreen nav={nav} />}
        {activePage === 'payout' && <PayoutScreen nav={nav} />}
        {activePage === 'reminders' && <RemindersScreen nav={nav} />}
        {activePage === 'smslog' && <SmsLogScreen nav={nav} />}
      </div>
    </div>
  );
};

// ============= DASHBOARD SCREEN =============
const DashboardScreen = ({ nav }) => {
  return (
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
        <div className="chit-card">
          <div className="card-head">
            <div>
              <div className="card-title">Active Cycles</div>
              <div className="card-sub">Ongoing chit draws</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => nav('cycles')}>
              View all
            </button>
          </div>

          <div className="dash-cycle">
            <div className="dash-cycle-no">1</div>
            <div className="dash-cycle-info">
              <div className="dash-cycle-name">Mani Chit — Ravi Kumar</div>
              <div className="dash-cycle-sub">Due: 30 Jun 2026</div>
            </div>
            <div className="dash-cycle-right">
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
            <div className="dash-cycle-right">
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
            <div className="dash-cycle-right">
              <div className="dash-cycle-amount">₹50,000</div>
              <span className="badge badge-green">Paid ✓</span>
            </div>
          </div>
        </div>

        <div className="chit-card">
          <div className="card-head">
            <div>
              <div className="card-title">Reminder Status</div>
              <div className="card-sub">Today's scheduler activity</div>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => nav('reminders')}>
              View all
            </button>
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
  );
};

// ============= GROUPS SCREEN =============
const GroupsScreen = ({ nav }) => {
  return (
    <div className="chit-screen active">
      <div className="grid2" style={{ marginBottom: '20px' }}>
        <div className="chit-card">
          <div className="card-head">
            <div className="card-title">Create Group</div>
          </div>
          <div className="field">
            <label className="label">
              Group name <span>*</span>
            </label>
            <input type="text" placeholder="e.g. Mani Chit" defaultValue="Mani Chit" />
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Start date <span>*</span></label>
              <input type="date" defaultValue="2026-06-02" />
            </div>
            <div className="field">
              <label className="label">Duration (months)</label>
              <input type="number" defaultValue="12" />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Join fee (outsiders ₹)</label>
              <input type="number" defaultValue="3000" />
            </div>
            <div className="field">
              <label className="label">
                Admin UPI ID <span>*</span>
              </label>
              <input type="text" placeholder="sirivaram@ybl" defaultValue="sirivaram@ybl" />
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

        <div className="chit-card">
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
                  <td>
                    <b>Mani Chit</b>
                  </td>
                  <td>6</td>
                  <td>Jun 2026</td>
                  <td>
                    <span className="badge badge-green">Active</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Village Chit B</b>
                  </td>
                  <td>8</td>
                  <td>Jan 2026</td>
                  <td>
                    <span className="badge badge-green">Active</span>
                  </td>
                </tr>
                <tr>
                  <td>
                    <b>Village Chit A</b>
                  </td>
                  <td>4</td>
                  <td>Mar 2025</td>
                  <td>
                    <span className="badge badge-gray">Closed</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= MEMBERS SCREEN =============
const MembersScreen = ({ nav }) => {
  const [memberType, setMemberType] = useState('Village member');

  return (
    <div className="chit-screen active">
      <div className="grid2" style={{ marginBottom: '20px' }}>
        <div className="chit-card">
          <div className="card-head">
            <div className="card-title">Add Member</div>
          </div>
          <div className="field">
            <label className="label">
              Group <span>*</span>
            </label>
            <select>
              <option>Mani Chit</option>
              <option>Village Chit B</option>
            </select>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">
                Full name <span>*</span>
              </label>
              <input type="text" placeholder="Ravi Kumar" />
            </div>
            <div className="field">
              <label className="label">
                Mobile <span>*</span>
              </label>
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
              <select>
                <option>Yes</option>
                <option>No</option>
              </select>
            </div>
          )}
          <div className="btn-row">
            <button className="btn btn-gold">Add Member</button>
            <button className="btn btn-outline">Reset</button>
          </div>
        </div>

        <div className="chit-card">
          <div className="card-head">
            <div className="card-title">Members — Mani Chit</div>
            <button className="btn btn-outline btn-sm">Filter ▾</button>
          </div>

          {[
            { initials: 'RK', name: 'Ravi Kumar', phone: '9876543210', upi: '9876543210@gpay', badge: 'Winner', badgeType: 'gold' },
            { initials: 'SR', name: 'Suresh Reddy', phone: '9876543211', upi: '9876543211@gpay', badge: 'Witness', badgeType: 'blue' },
            { initials: 'MR', name: 'Mahesh Rao', phone: '9876543212', upi: '9876543212@gpay', badge: 'Witness', badgeType: 'blue' },
            { initials: 'PK', name: 'Prakash Kumar', phone: '9876543213', upi: 'Outside member', badge: 'Active', badgeType: 'green' },
          ].map((member, idx) => (
            <div key={idx} className="member-row-item">
              <div className={`av av-${String.fromCharCode(97 + idx)}`}>{member.initials}</div>
              <div className="member-info">
                <div className="member-name">{member.name}</div>
                <div className="member-sub">
                  {member.phone} · {member.upi}
                </div>
              </div>
              <span className={`badge badge-${member.badgeType}`}>{member.badge}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============= CYCLES SCREEN =============
const CyclesScreen = ({ nav }) => {
  return (
    <div className="chit-screen active">
      <div className="grid2" style={{ marginBottom: '20px' }}>
        <div className="chit-card">
          <div className="card-head">
            <div className="card-title">Create Cycle</div>
          </div>
          <div className="field">
            <label className="label">
              Group <span>*</span>
            </label>
            <select>
              <option>Mani Chit</option>
              <option>Village Chit B</option>
            </select>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">
                Cycle number <span>*</span>
              </label>
              <select>
                <option>1</option>
                <option>2</option>
                <option>3</option>
              </select>
            </div>
            <div className="field">
              <label className="label">
                Principal amount (₹) <span>*</span>
              </label>
              <input type="number" placeholder="50000" defaultValue="50000" />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Interest rate (%)</label>
              <input type="number" placeholder="2.0" defaultValue="2" />
            </div>
            <div className="field">
              <label className="label">Interest amount (₹)</label>
              <input type="number" placeholder="1000" defaultValue="1000" />
            </div>
          </div>
          <div className="field">
            <label className="label">Draw date (optional)</label>
            <input type="date" defaultValue="2026-06-02" />
          </div>
          <div className="alert alert-gold">
            <span className="alert-icon">ℹ</span>
            <div>Due date is set separately after winner is selected.</div>
          </div>
          <div className="btn-row">
            <button className="btn btn-gold">Create Cycle</button>
            <button className="btn btn-outline">Reset</button>
          </div>
        </div>

        <div className="chit-card">
          <div className="card-head">
            <div className="card-title">Cycles — Mani Chit</div>
          </div>
          <div className="grid3">
            {[
              { no: '1', name: 'Cycle 1', amount: '₹50,000', due: 'Due: 30 Jun 2026', badge: 'Payout Pending', badgeType: 'amber', selected: true },
              { no: '2', name: 'Cycle 2', amount: '₹50,000', due: 'Due: Not set', badge: 'Open', badgeType: 'gray', selected: false },
              { no: '3', name: 'Cycle 3', amount: '₹50,000', due: 'Completed', badge: 'Paid ✓', badgeType: 'green', selected: false },
            ].map((cycle, idx) => (
              <div key={idx} className={`cycle-card ${cycle.selected ? 'selected' : ''}`}>
                <div className="cycle-no">{cycle.no}</div>
                <div className="cycle-name">{cycle.name}</div>
                <div className="cycle-amount">{cycle.amount}</div>
                <div className="cycle-due">{cycle.due}</div>
                <div style={{ marginTop: '8px' }}>
                  <span className={`badge badge-${cycle.badgeType}`}>{cycle.badge}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="divider"></div>
          <div className="card-head" style={{ marginBottom: '10px' }}>
            <div className="card-title">Set Due Date — Cycle 1</div>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">
                Repayment due date <span>*</span>
              </label>
              <input type="date" defaultValue="2026-06-30" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '14px' }}>
              <button className="btn btn-gold" style={{ width: '100%' }}>
                Set Due Date
              </button>
            </div>
          </div>
          <div className="alert alert-blue">
            <span className="alert-icon">🔔</span>
            <div>Reminders start automatically 10 days before due date (June 20) at 11 PM IST.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= WORKFLOW SCREEN =============
const WorkflowScreen = ({ nav }) => {
  const [step, setStep] = useState(5);

  return (
    <div className="chit-screen active">
      <div className="stepper">
        {[
          { num: 1, label: 'Create\nGroup', done: true },
          { num: 2, label: 'Add\nMembers', done: true },
          { num: 3, label: 'Create\nCycle', done: true },
          { num: 4, label: 'Set\nWitnesses', done: true },
          { num: 5, label: 'Set\nWinner', done: false, active: true },
          { num: 6, label: 'Set\nDue Date', done: false },
          { num: 7, label: 'Auto\nReminders', done: false },
          { num: 8, label: 'Mark\nPaid', done: false },
        ].map((s, idx) => (
          <div
            key={idx}
            className={`step-item ${s.done ? 'done' : ''} ${s.active ? 'active' : ''}`}
          >
            <div className="step-num">{s.done ? '✓' : s.num}</div>
            <div className="step-label">{s.label}</div>
          </div>
        ))}
      </div>

      {step === 5 && (
        <div className="grid2">
          <div className="chit-card">
            <div className="card-head">
              <div>
                <div className="card-title">Step 5 — Select Winner</div>
                <div className="card-sub">Member who won the chit draw</div>
              </div>
              <span className="badge badge-amber">Mani Chit, Cycle 1</span>
            </div>

            {[
              { initials: 'RK', name: 'Ravi Kumar', phone: '9876543210', selected: true },
              { initials: 'SR', name: 'Suresh Reddy', phone: '9876543211', selected: false },
              { initials: 'MR', name: 'Mahesh Rao', phone: '9876543212', selected: false },
            ].map((member, idx) => (
              <div key={idx} className={`winner-option ${member.selected ? 'selected' : ''}`}>
                <div className={`av av-${String.fromCharCode(97 + idx)}`}>{member.initials}</div>
                <div>
                  <div className="member-name">{member.name}</div>
                  <div className="member-sub">{member.phone}</div>
                </div>
                <div className="check"></div>
              </div>
            ))}

            <div className="btn-row">
              <button className="btn btn-gold" onClick={() => setStep(6)}>
                Confirm Winner & Send WhatsApp →
              </button>
            </div>
          </div>

          <div className="chit-card">
            <div className="card-head">
              <div className="card-title">WhatsApp Preview — Sent Immediately</div>
            </div>
            <div className="wa-preview">
              <div className="wa-header">
                <div className="av av-a">RK</div>
                <div>
                  <div className="wa-contact">Ravi Kumar</div>
                  <div className="wa-status">+91 98765 43210</div>
                </div>
              </div>
              <div className="wa-bubble">
                🏦 Sirivaram Chit Fund
                <br />
                <br />
                Dear Ravi Kumar,
                <br />
                <br />
                Congratulations. You have received the chit amount of ₹50000 under "Mani Chit"
                (Cycle 1).
                <br />
                <br />
                Amount Received : ₹50000
                <br />
                Received Date : 2026-06-02
                <br />
                Repayment Due : To be notified
                <br />
                <br />
                💳 Repayment Instructions:
                <br />
                Please transfer to admin UPI:
                <br />
                UPI ID : sirivaram@ybl
                <br />
                <br />
                After payment, share the transaction reference.
                <br />
                <br />
                Registered Witnesses:
                <br />• Suresh Reddy
                <br />• Mahesh Rao
                <br />
                <br />
                Thank You.
                <div className="wa-time">11:32 PM ✓✓</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="grid2">
          <div className="chit-card">
            <div className="card-head">
              <div>
                <div className="card-title">Step 6 — Set Repayment Due Date</div>
                <div className="card-sub">Reminders fire 10 days before this date</div>
              </div>
              <span className="badge badge-green">Winner set ✓</span>
            </div>

            <div className="alert alert-green">
              <span className="alert-icon">✓</span>
              <div>
                Winner <b>Ravi Kumar</b> set. WhatsApp notification sent successfully.
              </div>
            </div>

            <div className="info-row">
              <span className="info-key">Winner</span>
              <span className="info-val">Ravi Kumar</span>
            </div>
            <div className="info-row">
              <span className="info-key">Chit amount</span>
              <span className="info-val">₹50,000</span>
            </div>
            <div className="info-row">
              <span className="info-key">Draw date</span>
              <span className="info-val">2 Jun 2026</span>
            </div>

            <div className="divider"></div>

            <div className="field">
              <label className="label">
                Repayment due date <span>*</span>
              </label>
              <input type="date" defaultValue="2026-06-30" />
            </div>

            <div className="alert alert-blue">
              <span className="alert-icon">🔔</span>
              <div>
                Due date: <b>30 Jun 2026</b>
                <br />
                Reminders start: <b>20 Jun 2026</b> (10 days before)
                <br />
                Scheduler fires: Every day at <b>11:00 PM IST</b>
              </div>
            </div>

            <div className="btn-row">
              <button className="btn btn-gold">Set Due Date →</button>
            </div>
          </div>

          <div className="chit-card">
            <div className="card-title" style={{ marginBottom: '14px' }}>
              Automatic Reminder Schedule
            </div>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-dot gold"></div>
                <div className="tl-title">Jun 20 — Reminder 1 to winner</div>
                <div className="tl-sub">⚠️ Payment Reminder — due in 10 days</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot gold"></div>
                <div className="tl-title">Jun 21 — Reminder 2 to winner</div>
                <div className="tl-sub">⚠️ Payment Reminder — due in 9 days</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot gold"></div>
                <div className="tl-title">Jun 22 — Reminder 3 to winner</div>
                <div className="tl-sub">⚠️ Payment Reminder — due in 8 days</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot red"></div>
                <div className="tl-title">Jun 30 — Witnesses notified (once)</div>
                <div className="tl-sub">📢 Witness Notification sent</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot amber"></div>
                <div className="tl-title">Jul 1 onwards — Daily follow-up</div>
                <div className="tl-sub">Winner + both witnesses every day</div>
              </div>
              <div className="tl-item">
                <div className="tl-dot green"></div>
                <div className="tl-title">Admin marks paid → STOP</div>
                <div className="tl-sub">✅ Closure messages sent, no more reminders</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============= PAYOUT SCREEN =============
const PayoutScreen = ({ nav }) => {
  return (
    <div className="chit-screen active">
      <div className="grid2">
        <div className="chit-card">
          <div className="card-head">
            <div>
              <div className="card-title">Mark Payment Received</div>
              <div className="card-sub">Admin confirms repayment from winner</div>
            </div>
          </div>

          <div className="field">
            <label className="label">
              Select cycle <span>*</span>
            </label>
            <select>
              <option>Mani Chit — Cycle 1 — Ravi Kumar (Payout Pending)</option>
              <option>Village Chit B — Cycle 2 — Suresh (Drawn)</option>
            </select>
          </div>

          <div className="payout-box">
            <div className="payout-label">Total repayment amount</div>
            <div className="payout-amount">₹51,000</div>
            <div className="payout-breakdown">Principal ₹50,000 + Interest ₹1,000</div>
          </div>

          <div className="field">
            <label className="label">
              Winner UPI number <span>*</span>
            </label>
            <input type="text" placeholder="9876543210@gpay" defaultValue="9876543210@gpay" />
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">Principal received (₹)</label>
              <input type="number" defaultValue="50000" />
            </div>
            <div className="field">
              <label className="label">Interest received (₹)</label>
              <input type="number" defaultValue="1000" />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label className="label">
                Transaction reference <span>*</span>
              </label>
              <input type="text" placeholder="TXN20260630001" />
            </div>
            <div className="field">
              <label className="label">Proof image URL</label>
              <input type="text" placeholder="https://..." />
            </div>
          </div>

          <div className="alert alert-gold">
            <span className="alert-icon">💬</span>
            <div>
              On confirm: status → PAID, closure WhatsApp sent to winner and both witnesses,
              scheduler stops permanently.
            </div>
          </div>

          <div className="btn-row">
            <button className="btn btn-green">✓ Confirm Payment Received</button>
            <button className="btn btn-outline">Cancel</button>
          </div>
        </div>

        <div className="chit-card">
          <div className="card-title" style={{ marginBottom: '14px' }}>
            Closure Messages Preview
          </div>

          <div className="wa-message-label">To winner</div>
          <div className="wa-preview" style={{ marginBottom: '14px' }}>
            <div className="wa-header">
              <div className="av av-a">RK</div>
              <div>
                <div className="wa-contact">Ravi Kumar</div>
              </div>
            </div>
            <div className="wa-bubble">
              ✅ Sirivaram Chit Fund
              <br />
              <br />
              Dear Ravi Kumar,
              <br />
              <br />
              Your repayment for "Mani Chit" (Cycle 1) has been successfully received.
              <br />
              <br />
              Amount : ₹50000
              <br />
              Status : Payment Completed
              <br />
              <br />
              Thank you for your timely repayment.
              <br />
              <br />
              Sirivaram Chit Fund
              <div className="wa-time">Now ✓✓</div>
            </div>
          </div>

          <div className="wa-message-label">To witnesses</div>
          <div className="wa-preview">
            <div className="wa-header">
              <div className="av av-b">SR</div>
              <div>
                <div className="wa-contact">Suresh Reddy + Mahesh Rao</div>
              </div>
            </div>
            <div className="wa-bubble">
              ✅ Sirivaram Chit Fund
              <br />
              <br />
              Dear Suresh Reddy,
              <br />
              <br />
              The pending chit repayment by Ravi Kumar for "Mani Chit" (Cycle 1) has been
              successfully settled.
              <br />
              <br />
              No further follow-up is required.
              <br />
              <br />
              Thank you for your cooperation.
              <br />
              <br />
              Sirivaram Chit Fund
              <div className="wa-time">Now ✓✓</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= REMINDERS SCREEN =============
const RemindersScreen = ({ nav }) => {
  return (
    <div className="chit-screen active">
      <div className="alert alert-gold" style={{ marginBottom: '20px' }}>
        <span className="alert-icon">🔔</span>
        <div>
          Scheduler runs every day at <b>11:00 PM IST</b>. Reminders are fully automatic —
          no manual action needed.
        </div>
      </div>

      <div className="chit-card" style={{ marginBottom: '20px' }}>
        <div className="card-head">
          <div className="card-title">Active Reminder Cycles</div>
          <span className="badge badge-red">2 overdue</span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Winner</th>
                <th>Chit / Cycle</th>
                <th>Amount</th>
                <th>Due Date</th>
                <th>Reminders</th>
                <th>Witnesses Notified</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="av av-a" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                      RK
                    </div>
                    Ravi Kumar
                  </div>
                </td>
                <td>Mani Chit / 1</td>
                <td>₹50,000</td>
                <td>30 Jun 2026</td>
                <td>
                  <span className="badge badge-gold">1 / 3</span>
                </td>
                <td>
                  <span className="badge badge-gray">No</span>
                </td>
                <td>
                  <span className="badge badge-amber">Payout Pending</span>
                </td>
              </tr>
              <tr>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div className="av av-b" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                      SB
                    </div>
                    Suresh Babu
                  </div>
                </td>
                <td>Village Chit B / 2</td>
                <td>₹75,000</td>
                <td>15 Jul 2026</td>
                <td>
                  <span className="badge badge-red">3 / 3</span>
                </td>
                <td>
                  <span className="badge badge-red">Yes</span>
                </td>
                <td>
                  <span className="badge badge-red">Overdue</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="chit-card">
        <div className="card-head">
          <div className="card-title">Reminder Message Flow</div>
        </div>
        <div className="timeline">
          <div className="tl-item">
            <div className="tl-dot gold"></div>
            <div className="tl-title">Phase 1 — 10 days before due date</div>
            <div className="tl-sub">
              Reminder sent to winner daily (max 3 times) · ⚠️ Payment Reminder message
            </div>
          </div>
          <div className="tl-item">
            <div className="tl-dot red"></div>
            <div className="tl-title">Phase 2 — Due date passed, not paid</div>
            <div className="tl-sub">Witnesses notified once · 📢 Witness Notification message</div>
          </div>
          <div className="tl-item">
            <div className="tl-dot amber"></div>
            <div className="tl-title">Phase 3 — Continued follow-up daily</div>
            <div className="tl-sub">Winner + both witnesses get daily follow-up message</div>
          </div>
          <div className="tl-item">
            <div className="tl-dot green"></div>
            <div className="tl-title">Admin marks paid → everything stops</div>
            <div className="tl-sub">✅ Closure sent, status = PAID, scheduler skips forever</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============= SMS LOG SCREEN =============
const SmsLogScreen = ({ nav }) => {
  return (
    <div className="chit-screen active">
      <div className="chit-card">
        <div className="card-head">
          <div className="card-title">WhatsApp / SMS Log</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select style={{ width: 'auto', height: '30px', fontSize: '12px' }}>
              <option>All cycles</option>
              <option>Mani Chit — Cycle 1</option>
            </select>
            <button className="btn btn-outline btn-sm">Export</button>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>To</th>
                <th>Cycle</th>
                <th>Message type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ color: 'var(--text3)' }}>Today 11:00 PM</td>
                <td>Ravi Kumar (+91 98765 43210)</td>
                <td>Mani Chit / 1</td>
                <td>
                  <span className="badge badge-amber">Reminder 1</span>
                </td>
                <td>
                  <span className="badge badge-green">Sent ✓</span>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text3)' }}>Today 11:00 PM</td>
                <td>Suresh Babu (+91 98765 43215)</td>
                <td>Village B / 2</td>
                <td>
                  <span className="badge badge-red">Witness Notify</span>
                </td>
                <td>
                  <span className="badge badge-green">Sent ✓</span>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text3)' }}>Yesterday 11:00 PM</td>
                <td>Ravi Kumar (+91 98765 43210)</td>
                <td>Mani Chit / 1</td>
                <td>
                  <span className="badge badge-gold">Winner Notify</span>
                </td>
                <td>
                  <span className="badge badge-green">Sent ✓</span>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text3)' }}>2 Jun 3:30 PM</td>
                <td>Mahesh Rao (+91 98765 43212)</td>
                <td>Mani Chit / 3</td>
                <td>
                  <span className="badge badge-blue">Closure</span>
                </td>
                <td>
                  <span className="badge badge-green">Sent ✓</span>
                </td>
              </tr>
              <tr>
                <td style={{ color: 'var(--text3)' }}>1 Jun 11:00 PM</td>
                <td>Ramesh (+91 98765 43219)</td>
                <td>Village A / 1</td>
                <td>
                  <span className="badge badge-amber">Follow-up</span>
                </td>
                <td>
                  <span className="badge badge-red">Failed ✗</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ChitFundDashboard;
