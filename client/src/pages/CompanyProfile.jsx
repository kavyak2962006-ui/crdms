import React, { useState, useEffect } from 'react';
import api from '../services/api';

const CompanyProfile = () => {
  const [profile, setProfile] = useState({
    company_name: '',
    industry: '',
    website: '',
    company_email: '',
    phone: '',
    address: '',
    city: '',
    state_name: '',
    country: '',
    company_size: '',
    founded_year: '',
    description: '',
    culture: '',
    benefits: ''
  });
  const [originalProfile, setOriginalProfile] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [isExisting, setIsExisting] = useState(false);

  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Load existing profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/hr/company/profile');
        const data = res.data;
        setProfile({
          company_name: data.company_name || '',
          industry: data.industry || '',
          website: data.website || '',
          company_email: data.company_email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          state_name: data.state_name || '',
          country: data.country || '',
          company_size: data.company_size || '',
          founded_year: data.founded_year || '',
          description: data.description || '',
          culture: data.culture || '',
          benefits: data.benefits || ''
        });
        setOriginalProfile(data);
        setIsExisting(true);
        if (data.logo_path) {
          setLogoPreview(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/${data.logo_path}`);
        }
      } catch (err) {
        if (err.response && err.response.status !== 404) {
          console.error(err);
          setMessage('Failed to load company profile.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    setLogoFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setLogoPreview(null);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!profile.company_name.trim()) newErrors.company_name = 'Company Name is required';
    if (!profile.industry.trim()) newErrors.industry = 'Industry is required';
    if (!profile.company_email.trim()) newErrors.company_email = 'Company Email is required';
    else if (!emailRegex.test(profile.company_email)) newErrors.company_email = 'Invalid email format';
    if (profile.website && !profile.website.startsWith('http')) newErrors.website = 'Website should start with http:// or https://';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setMessage('');
    try {
      const formData = new FormData();
      Object.entries(profile).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (isExisting) {
        await api.put('/hr/company/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        await api.post('/hr/company/profile', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
      setMessage('Company profile saved successfully.');
      setIsExisting(true);
      setOriginalProfile({ ...profile, logo_path: logoPreview });
    } catch (err) {
      console.error(err);
      const errMsg = err.response && err.response.data && err.response.data.message ? err.response.data.message : err.message;
        setMessage(errMsg || 'Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (originalProfile) {
      setProfile({
        company_name: originalProfile.company_name || '',
        industry: originalProfile.industry || '',
        website: originalProfile.website || '',
        company_email: originalProfile.company_email || '',
        phone: originalProfile.phone || '',
        address: originalProfile.address || '',
        city: originalProfile.city || '',
        state_name: originalProfile.state_name || '',
        country: originalProfile.country || '',
        company_size: originalProfile.company_size || '',
        founded_year: originalProfile.founded_year || '',
        description: originalProfile.description || '',
        culture: originalProfile.culture || '',
        benefits: originalProfile.benefits || ''
      });
      if (originalProfile.logo_path) {
        setLogoPreview(`${process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}/${originalProfile.logo_path}`);
      } else {
        setLogoPreview(null);
      }
      setLogoFile(null);
      setMessage('Changes cancelled.');
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-white">Loading company profile...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-white">Company Profile</h1>
      <p className="text-slate-300 mb-6">Manage your company information and help students learn about your organization.</p>
      {message && (
        <div className={`mb-4 p-2 rounded ${message.includes('success') ? 'bg-green-600' : 'bg-red-600'} text-white`}>{message}</div>
      )}
      <div className="glass-card p-6 rounded-xl shadow-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Logo section */}
          <div className="flex items-center space-x-4 mb-4">
            {logoPreview && <img src={logoPreview} alt="Logo Preview" className="w-20 h-20 object-cover rounded" />}
            <label className="btn-primary cursor-pointer">
              Upload Logo
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>

          {/* Basic Information */}
          <h2 className="text-lg font-semibold text-white">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Company Name *</label>
              <input type="text" name="company_name" value={profile.company_name} onChange={handleChange} className="glass-input w-full" required />
              {errors.company_name && <p className="text-xs text-red-400 mt-1">{errors.company_name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Industry *</label>
              <input type="text" name="industry" value={profile.industry} onChange={handleChange} className="glass-input w-full" required />
              {errors.industry && <p className="text-xs text-red-400 mt-1">{errors.industry}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Company Email *</label>
              <input type="email" name="company_email" value={profile.company_email} onChange={handleChange} className="glass-input w-full" required />
              {errors.company_email && <p className="text-xs text-red-400 mt-1">{errors.company_email}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Phone</label>
              <input type="text" name="phone" value={profile.phone} onChange={handleChange} className="glass-input w-full" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-200">Website</label>
              <input type="url" name="website" value={profile.website} onChange={handleChange} className="glass-input w-full" />
              {errors.website && <p className="text-xs text-red-400 mt-1">{errors.website}</p>}
            </div>
          </div>

          {/* Location */}
          <h2 className="text-lg font-semibold text-white mt-6">Company Location</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Address</label>
              <input type="text" name="address" value={profile.address} onChange={handleChange} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">City</label>
              <input type="text" name="city" value={profile.city} onChange={handleChange} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">State</label>
              <input type="text" name="state_name" value={profile.state_name} onChange={handleChange} className="glass-input w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Country</label>
              <input type="text" name="country" value={profile.country} onChange={handleChange} className="glass-input w-full" />
            </div>
          </div>

          {/* Details */}
          <h2 className="text-lg font-semibold text-white mt-6">Company Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200">Company Size</label>
              <select name="company_size" value={profile.company_size} onChange={handleChange} className="glass-input w-full">
                <option value="">Select size</option>
                <option>1–10</option>
                <option>11–50</option>
                <option>51–200</option>
                <option>201–500</option>
                <option>501–1000</option>
                <option>1001–5000</option>
                <option>5000+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200">Founded Year</label>
              <input type="number" name="founded_year" value={profile.founded_year} onChange={handleChange} className="glass-input w-full" min="1900" max="2100" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-200">Company Description</label>
              <textarea name="description" value={profile.description} onChange={handleChange} className="glass-input w-full" rows={3} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-200">Company Culture</label>
              <textarea name="culture" value={profile.culture} onChange={handleChange} className="glass-input w-full" rows={2} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-200">Benefits</label>
              <textarea name="benefits" value={profile.benefits} onChange={handleChange} className="glass-input w-full" rows={2} />
            </div>
          </div>

          <div className="flex space-x-4 mt-6">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" onClick={handleCancel} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanyProfile;
