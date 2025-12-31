import { useState, useEffect } from 'react';
import { supabaseClient } from '../../lib/supabase';
import { Calendar, Clock, User, Mail, Building, Phone, Loader2, CheckCircle } from 'lucide-react';
import { getUserDetails, saveUserDetails } from '../../lib/userStorage';

export default function CalendarBooking() {
  const storedDetails = getUserDetails();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: storedDetails.full_name || '',
    email: storedDetails.email || '',
    company: storedDetails.company || '',
    phone: storedDetails.phone || '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAvailability = async () => {
      try {
        const slots = await supabaseClient.entities.Availability.list();
        setAvailableSlots(slots);
      } catch (error) {
        console.error('Failed to load availability:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailability();
  }, []);

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) {
      alert('Please select a date and time');
      return;
    }

    setIsSubmitting(true);

    try {
      // Create lead
      const lead = await supabaseClient.entities.Lead.create({
        ...formData,
        source: 'strategy_call_booking',
      });

      // Update availability slot
      const slot = availableSlots.find(
        (s) => s.date === selectedDate && s.time === selectedTime && !s.booked
      );

      if (slot) {
        await supabaseClient.entities.Availability.update(slot.id, {
          booked: true,
          lead_id: lead.id,
        });
      }

      // Store call scheduled flag and user details in localStorage
      localStorage.setItem('call_scheduled', 'true');
      saveUserDetails({
        full_name: formData.full_name,
        email: formData.email,
        company: formData.company,
        phone: formData.phone,
      });
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Failed to book:', error);
      alert('Failed to book appointment. Please try again.');
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-primary mb-4">Appointment Booked!</h2>
          <p className="text-lg text-slate-600 mb-2">
            Your strategy call is scheduled for:
          </p>
          <p className="text-xl font-semibold text-primary mb-8">
            {selectedDate} at {selectedTime}
          </p>
          <p className="text-slate-600 mb-8">
            Check your email for confirmation and calendar invite.
          </p>
          <a href="/" className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors">
            Back to Home
          </a>
        </div>
      </div>
    );
  }

  const availableDates = Array.from(new Set(availableSlots.filter((s) => !s.booked).map((s) => s.date))).sort();
  const timesForDate = selectedDate
    ? availableSlots.filter((s) => s.date === selectedDate && !s.booked).map((s) => s.time).sort()
    : [];

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      {/* Calendar Selection */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
          <Calendar className="w-6 h-6" />
          Select Date & Time
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-3">Available Dates</label>
              <div className="grid grid-cols-2 gap-3">
                {availableDates.map((date) => (
                  <button
                    key={date}
                    onClick={() => handleDateSelect(date)}
                    className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                      selectedDate === date
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </button>
                ))}
              </div>
            </div>

            {selectedDate && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Available Times</label>
                <div className="grid grid-cols-3 gap-3">
                  {timesForDate.map((time) => (
                    <button
                      key={time}
                      onClick={() => handleTimeSelect(time)}
                      className={`px-4 py-3 rounded-xl border-2 transition-colors ${
                        selectedTime === time
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Contact Form */}
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-8">
        <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
          <User className="w-6 h-6" />
          Your Information
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="full_name" className="block text-slate-700 font-medium mb-1.5">
              Full Name *
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={formData.full_name}
              onChange={handleChange}
              required
              placeholder="John Smith"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-slate-700 font-medium mb-1.5">
              Email Address *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="john@company.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label htmlFor="company" className="block text-slate-700 font-medium mb-1.5">
                Company
              </label>
              <input
                id="company"
                name="company"
                type="text"
                value={formData.company}
                onChange={handleChange}
                placeholder="Acme Inc."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-slate-700 font-medium mb-1.5">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-slate-700 font-medium mb-1.5">
              What would you like to discuss?
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Tell us about your organization's needs..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:ring-2 focus:ring-primary focus:border-primary resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={!selectedDate || !selectedTime || isSubmitting}
            className="w-full bg-primary hover:bg-primary-dark text-white py-6 rounded-xl font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5" />
                Confirm Appointment
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

