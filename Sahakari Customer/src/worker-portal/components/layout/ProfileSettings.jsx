import React, { useState } from 'react';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';

// List of premium pre-defined worker avatars in case they want presets
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1628157582853-a796fa650a6a?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80'
];

export const ProfileSettings = () => {
  const { workerProfile, setWorkerProfile, addToast } = useNegotiation();
  const { currentUser } = useAuth();

  const [isEditing, setIsEditing] = useState(false);

  // Form states initialized from workerProfile
  const [name, setName] = useState(workerProfile.name);
  const [role, setRole] = useState(workerProfile.role);
  const [phone, setPhone] = useState(workerProfile.phone || '9876543210');
  const [email, setEmail] = useState(workerProfile.email || 'suresh@sahakari.in');
  const [experience, setExperience] = useState(workerProfile.experience || '12 Years');
  const [baseLocation, setBaseLocation] = useState(workerProfile.baseLocation || 'Indiranagar, Bangalore');
  const [languages, setLanguages] = useState(workerProfile.languages || 'Hindi, English, Kannada');
  const [aboutMe, setAboutMe] = useState(workerProfile.aboutMe || 'Dedicated and safety-certified technician working with Sahakari since 2022. I specialize in rapid diagnostic resolution.');
  const [skills, setSkills] = useState(workerProfile.verifiedSkills || []);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [avatar, setAvatar] = useState(workerProfile.avatar || '/images/worker_avatar.jpg');

  // Handle custom image file upload converting to base64
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        addToast('File too large', 'Please upload an image smaller than 2MB.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        // auto-save avatar directly or let them save it
        setWorkerProfile((prev) => ({
          ...prev,
          avatar: reader.result
        }));
        addToast('Avatar Updated', 'Your profile image has been uploaded successfully.', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (url) => {
    setAvatar(url);
    setWorkerProfile((prev) => ({
      ...prev,
      avatar: url
    }));
    addToast('Avatar Updated', 'Selected preset avatar successfully.', 'success');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('Validation Error', 'Name is required.', 'error');
      return;
    }

    setWorkerProfile((prev) => ({
      ...prev,
      name: name.trim(),
      role: role.trim(),
      phone: phone.trim(),
      email: email.trim(),
      experience: experience.trim(),
      baseLocation: baseLocation.trim(),
      languages: languages.trim(),
      aboutMe: aboutMe.trim(),
      verifiedSkills: skills,
      avatar: avatar
    }));

    setIsEditing(false);
    addToast('Profile Saved', 'Your profile changes have been saved successfully.', 'success');
  };

  const addSkill = () => {
    if (newSkillInput.trim() && !skills.includes(newSkillInput.trim())) {
      setSkills([...skills, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const removeSkill = (skillToRemove) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-on-surface">Member Profile Settings</h1>
          <p className="text-xs text-on-surface-variant">Update your public worker portfolio, contact information, and specializations.</p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 h-9 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span> Edit Profile
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  // Revert states
                  setName(workerProfile.name);
                  setRole(workerProfile.role);
                  setPhone(workerProfile.phone || '9876543210');
                  setEmail(workerProfile.email || 'suresh@sahakari.in');
                  setExperience(workerProfile.experience || '12 Years');
                  setBaseLocation(workerProfile.baseLocation || 'Indiranagar, Bangalore');
                  setLanguages(workerProfile.languages || 'Hindi, English, Kannada');
                  setAboutMe(workerProfile.aboutMe || 'Dedicated and safety-certified technician working with Sahakari since 2022. I specialize in rapid diagnostic resolution.');
                  setSkills(workerProfile.verifiedSkills || []);
                  setAvatar(workerProfile.avatar || '/images/worker_avatar.jpg');
                  setIsEditing(false);
                }}
                className="px-3 h-9 border border-outline-variant text-on-surface font-bold text-xs rounded-lg hover:bg-surface-container transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 h-9 bg-secondary text-on-secondary font-bold text-xs rounded-lg hover:opacity-90 flex items-center gap-1.5 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">save</span> Save Changes
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Avatar & Quick Stats Card */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Avatar Upload Card */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-5 text-center flex flex-col items-center shadow-xs">
            <div className="relative group">
              <img
                src={avatar}
                alt={name}
                className="w-28 h-28 rounded-full object-cover border-4 border-primary/20 shadow-md transition-all group-hover:opacity-85"
              />
              <label className="absolute bottom-1 right-1 bg-primary text-on-primary w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-elevation-1 hover:scale-105 active:scale-95 transition-all">
                <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>
            
            <h2 className="text-base font-bold text-on-surface mt-3">{name}</h2>
            <p className="text-xs text-on-surface-variant">{role}</p>
            
            <div className="flex gap-2 justify-center mt-2.5">
              <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed text-[10px] font-bold rounded">
                {currentUser?.workerId || workerProfile.workerId || 'WRK-8821'}
              </span>
              <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container text-[10px] font-bold rounded">
                {currentUser?.coopId || workerProfile.coopId}
              </span>
            </div>

            {/* Presets Selection */}
            <div className="w-full border-t border-outline-variant/60 mt-4 pt-4 text-left">
              <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">Preset Avatars</p>
              <div className="flex items-center gap-2.5 justify-start">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(url)}
                    className="w-8 h-8 rounded-full overflow-hidden border border-outline-variant hover:border-primary transition-all flex-shrink-0"
                  >
                    <img src={url} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Summary Card */}
          <div className="bg-surface border border-outline-variant rounded-2xl p-5 space-y-3.5 shadow-xs">
            <h3 className="text-xs font-black text-outline uppercase tracking-wider">Performance Rating</h3>
            
            <div className="flex items-center gap-3">
              <div className="text-3xl font-black text-on-surface flex items-center gap-1 font-mono">
                {workerProfile.rating} <span className="text-amber-500 text-2xl">★</span>
              </div>
              <div className="text-[11px] text-on-surface-variant leading-tight">
                Based on <span className="font-bold text-on-surface">{workerProfile.reviewsCount}</span> verified customer reviews
              </div>
            </div>

            <div className="border-t border-outline-variant/60 pt-3.5 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Coop Tier</span>
                <span className="font-bold text-primary">{workerProfile.tier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Acceptance Rate</span>
                <span className="font-bold text-on-surface">{workerProfile.acceptanceRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">On-Time Arrival</span>
                <span className="font-bold text-on-surface">{workerProfile.onTimeRate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Jobs Dispatched</span>
                <span className="font-bold text-on-surface">{workerProfile.completedJobsToday + 24} jobs</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Editable Fields form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-outline-variant rounded-2xl p-5 md:p-6 shadow-xs">
            <form onSubmit={handleSave} className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Full Name</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

                {/* Role/Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Professional Role / Title</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Phone Number</label>
                  <input
                    type="tel"
                    disabled={!isEditing}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Email Address</label>
                  <input
                    type="email"
                    disabled={!isEditing}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

                {/* Experience */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Years of Experience</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={experience}
                    onChange={(e) => setExperience(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

                {/* Base Location */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-on-surface">Base Dispatch Area / Location</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={baseLocation}
                    onChange={(e) => setBaseLocation(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

                {/* Languages */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface">Languages Spoken</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    className="w-full h-10 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all"
                  />
                </div>

              </div>

              {/* Bio/About Me */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface">About Me (Coop Public Bio)</label>
                <textarea
                  disabled={!isEditing}
                  value={aboutMe}
                  onChange={(e) => setAboutMe(e.target.value)}
                  rows={3}
                  className="w-full p-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface placeholder:text-outline/40 focus:outline-none focus:border-primary disabled:bg-surface-container-low disabled:cursor-not-allowed transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Verified & Cooperative Skills list */}
              <div className="space-y-2 border-t border-outline-variant/60 pt-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-outline uppercase tracking-wider">Skills & Specializations</label>
                  {isEditing && (
                    <span className="text-[10px] text-secondary font-semibold">Click cross to remove</span>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-1.5 py-1">
                  {skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 bg-surface-container border border-outline-variant rounded-full text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all shadow-xs"
                    >
                      {skill}
                      {isEditing && (
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="w-4 h-4 rounded-full bg-outline/20 hover:bg-error/20 hover:text-error flex items-center justify-center text-[10px] font-black"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                {isEditing && (
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      placeholder="Add a new skill tag..."
                      className="flex-1 h-9 px-3 bg-surface-container-lowest border border-outline-variant rounded-lg text-xs text-on-surface focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={addSkill}
                      className="px-3 h-9 bg-primary text-on-primary font-bold text-xs rounded-lg hover:opacity-90 flex items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span> Add
                    </button>
                  </div>
                )}
              </div>

            </form>
          </div>
        </div>

      </div>

    </div>
  );
};
