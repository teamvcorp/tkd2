import React from 'react';

const ContactPage = () => {
    return (
        <main className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
            <p className="mb-6 text-gray-700">
                Have questions or want to get in touch? Fill out the form below and we’ll get back to you soon.
            </p>
            <form className="max-w-lg space-y-4">
                <div>
                    <label htmlFor="name" className="block font-medium mb-1">
                        Name
                    </label>
                    <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label htmlFor="email" className="block font-medium mb-1">
                        Email
                    </label>
                    <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <div>
                    <label htmlFor="message" className="block font-medium mb-1">
                        Message
                    </label>
                    <textarea
                        id="message"
                        name="message"
                        rows={5}
                        required
                        className="w-full border rounded px-3 py-2"
                    />
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
                >
                    Send Message
                </button>
            </form>
        </main>
    );
};

export default ContactPage;