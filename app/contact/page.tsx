// components/ContactPage.jsx
'use client';

import { useState } from 'react';
import styles from '../styles/ContactPage.module.css';

const ContactPage = () => {
    const [form, setForm] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [errors, setErrors] = useState({
        name: '',
        email: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user types
        setErrors(prev => ({
            ...prev,
            [name]: '',
        }));
    };

    const validateForm = () => {
        const newErrors = { name: '', email: '', message: '' };
        let isValid = true;

        if (!form.name.trim()) {
            newErrors.name = 'Name is required';
            isValid = false;
        }
        if (!form.email.trim()) {
            newErrors.email = 'Email is required';
            isValid = false;
        } else if (!/\S+@\S+\.\S+/.test(form.email)) {
            newErrors.email = 'Invalid email format';
            isValid = false;
        }
        if (!form.message.trim()) {
            newErrors.message = 'Message is required';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (validateForm()) {
            try {
                // Replace with your API endpoint or service
                window.location.href = `mailto:admin@thevacorp.com?subject=Contact from ${encodeURIComponent(form.name)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`;
                const response = { ok: true }; // Simulate success for the rest of the logic
                if (response.ok) {
                    alert('Message sent successfully!');
                    setForm({ name: '', email: '', message: '' });
                    setErrors({ name: '', email: '', message: '' });
                } else {
                    alert('Failed to send message.');
                }
            } catch (error) {
                console.error('Submission error:', error);
                alert('An error occurred.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
           
            <main className={styles.container}>
                <h1 className={styles.title}>Contact Us</h1>
                <p className={styles.intro}>
                    Have questions or want to get in touch? Fill out the form below and we’ll get back to you soon.
                </p>
                <form className={styles.form} onSubmit={handleSubmit} aria-label="Contact form">
                    <div>
                        <label htmlFor="name" className={styles.label}>
                            Name
                        </label>
                        <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            aria-required="true"
                            className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                            value={form.name}
                            onChange={handleChange}
                        />
                        {errors.name && <p className={styles.error}>{errors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="email" className={styles.label}>
                            Email
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            aria-required="true"
                            className={`${styles.input} ${errors.email ? styles.inputError : ''}`}
                            value={form.email}
                            onChange={handleChange}
                        />
                        {errors.email && <p className={styles.error}>{errors.email}</p>}
                    </div>
                    <div>
                        <label htmlFor="message" className={styles.label}>
                            Message
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            rows={5}
                            required
                            aria-required="true"
                            className={`${styles.input} ${errors.message ? styles.inputError : ''}`}
                            value={form.message}
                            onChange={handleChange}
                        />
                        {errors.message && <p className={styles.error}>{errors.message}</p>}
                    </div>
                    <button type="submit" className={styles.button}>
                        Send Message
                    </button>
                </form>
                <div className={styles.textInfo}>
                <h3 className={styles.h3}> Address</h3>
<p>503 Lake Avenue Storm Lake, IA 50588</p>
                <h3 className={styles.h3}> Phone</h3>
<p>(712) 638-5050</p>
                <h3 className={styles.h3}> Email</h3>
<p>admin@thevacorp.com</p>

                </div>
            </main>
        </div>
    );
};

export default ContactPage;