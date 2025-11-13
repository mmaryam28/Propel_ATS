import React, { useState } from 'react';
import { Icon } from '../components/ui/Icon';

export default function FormExample() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: '',
    newsletter: false,
    plan: 'basic'
  });
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setLoading(false);
    // Show success message
    alert('Form submitted successfully!');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="space-y-4 mb-8">
        <h1 className="text-2xl font-semibold">Form Components</h1>
        <p className="text-gray-600">
          Examples of form components with various states and variations.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic inputs */}
        <div className="form-section">
          <h2 className="form-section-title">Basic Inputs</h2>
          
          <div className="form-row">
            <div className="flex-1">
              <label className="form-label required" htmlFor="firstName">First name</label>
              <input
                id="firstName"
                type="text"
                className="input"
                placeholder="John"
                required
              />
            </div>
            <div className="flex-1">
              <label className="form-label required" htmlFor="lastName">Last name</label>
              <input
                id="lastName"
                type="text"
                className="input"
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
            <div className="input-group">
              <span className="input-group-text">
                <Icon name="mail" size="sm" />
              </span>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <p className="form-help">We'll never share your email.</p>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              className="input input-error"
              placeholder="(555) 555-5555"
            />
            <p className="form-error">Please enter a valid phone number</p>
          </div>
        </div>

        {/* Textareas */}
        <div className="form-section">
          <h2 className="form-section-title">Text Areas</h2>
          
          <div className="form-group">
            <label className="form-label" htmlFor="message">Message</label>
            <textarea
              id="message"
              className="input"
              placeholder="Enter your message here..."
              rows={4}
            />
          </div>
        </div>

        {/* Selects */}
        <div className="form-section">
          <h2 className="form-section-title">Select Inputs</h2>
          
          <div className="form-group">
            <label className="form-label" htmlFor="plan">Subscription Plan</label>
            <select id="plan" className="input">
              <option value="basic">Basic Plan</option>
              <option value="pro">Pro Plan</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
        </div>

        {/* Checkboxes & Radios */}
        <div className="form-section">
          <h2 className="form-section-title">Checkboxes & Radios</h2>
          
          <div className="space-y-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="checkbox" />
              <span>Subscribe to newsletter</span>
            </label>

            <div className="space-y-2">
              <div className="font-medium text-sm text-gray-700">Notification Preferences</div>
              <label className="flex items-center gap-2">
                <input type="radio" name="notifications" className="radio" defaultChecked />
                <span>Email</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="notifications" className="radio" />
                <span>SMS</span>
              </label>
            </div>
          </div>
        </div>

        {/* Button Examples */}
        <div className="form-section">
          <h2 className="form-section-title">Buttons</h2>
          
          <div className="flex flex-wrap gap-4">
            <button type="button" className="btn btn-primary btn-sm">
              Small Primary
            </button>
            <button type="button" className="btn btn-secondary btn-sm">
              Small Secondary
            </button>
            <button type="button" className="btn btn-tertiary btn-sm">
              Small Tertiary
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <button type="button" className="btn btn-primary btn-md">
              Medium Primary
            </button>
            <button type="button" className="btn btn-secondary btn-md">
              Medium Secondary
            </button>
            <button type="button" className="btn btn-tertiary btn-md">
              Medium Tertiary
            </button>
          </div>
          
          <div className="flex flex-wrap gap-4 mt-4">
            <button type="button" className="btn btn-primary btn-lg">
              Large Primary
            </button>
            <button type="button" className="btn btn-secondary btn-lg">
              Large Secondary
            </button>
            <button type="button" className="btn btn-tertiary btn-lg">
              Large Tertiary
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <button type="button" className="btn btn-primary" disabled>
              Disabled Primary
            </button>
            <button type="button" className="btn btn-secondary" disabled>
              Disabled Secondary
            </button>
            <button type="button" className="btn btn-tertiary" disabled>
              Disabled Tertiary
            </button>
          </div>

          <div className="flex flex-wrap gap-4 mt-4">
            <button type="button" className="btn btn-primary" data-loading="true">
              <Icon name="loading" className="btn-spinner" />
              <span>Loading Primary</span>
            </button>
            <button type="button" className="btn btn-secondary" data-loading="true">
              <Icon name="loading" className="btn-spinner" />
              <span>Loading Secondary</span>
            </button>
            <button type="button" className="btn btn-danger">
              Danger Button
            </button>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            data-loading={loading}
            disabled={loading}
          >
            <Icon name="loading" className="btn-spinner" />
            <span>Submit Form</span>
          </button>
          <button type="button" className="btn btn-secondary">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}