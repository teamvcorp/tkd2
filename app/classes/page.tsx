import React from 'react';

const ClassesPage: React.FC = () => {
    return (
        <main>
        
<section className="bg-gray-100 py-16 px-6">
  <div className="max-w-5xl mx-auto text-center mb-12">
    <h2 className="text-4xl font-bold text-black mb-4">Our Classes</h2>
    <p className="text-lg text-gray-700">
      Whether you're a beginner or an advanced student, we offer tailored programs to help you grow in skill, confidence, and discipline.
    </p>
  </div>

  <div className="max-w-6xl mx-auto grid gap-10 md:grid-cols-3">

  <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Lil' Kids Classes <br></br> (Ages 3–5)</h3>
      <p className="text-gray-700 mb-4">
        Focused on building discipline, respect, and basic martial arts skills in a fun and structured environment.
      </p>
      <div className="text-sm text-gray-800">
        <p><strong>Mon, Wed & Fri:</strong> 4:30–5:15 PM</p>
        
      </div>
    </div>

    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Kids Classes <br></br> (Ages 6–10)</h3>
      <p className="text-gray-700 mb-4">
        Focused on building discipline, respect, and basic martial arts skills in a fun and structured environment.
      </p>
      <div className="text-sm text-gray-800">
        <p><strong>Mon, Wed & Fri:</strong> 5:30–6:30 PM</p>
        <p><strong>Sat:</strong> 10:00 AM - 2 PM (Optional)</p>
      </div>
    </div>

  
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Teen & Adult Classes <br></br> (Ages 11+)</h3>
      <p className="text-gray-700 mb-4">
        Designed to improve fitness, self-defense skills, and personal confidence through advanced training and techniques.
      </p>
      <div className="text-sm text-gray-800">
        <p><strong>Mon, Wed & Fri:</strong> 6:30 – 7:30 PM</p>
        <p><strong>Sat:</strong> 10:00 AM – 2 PM (Optional) </p>
      </div>
    </div>


    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Kids Yotae <br></br> (Ages 6+)</h3>
      <p className="text-gray-700 mb-4">
Yotae is a fun mix of Taekwondo and yoga made just for kids! You’ll learn cool moves, stretch like a ninja, and feel awesome after every class—all in a relaxed and playful space.      </p>
      <div className="text-sm text-gray-800">
        <p><strong>Tue & Thur:</strong> 4:30 – 5:30 PM</p>
       
      </div>
    </div>
   
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Adult Yotae for Beginners <br></br> (Ages 12+)</h3>
      <p className="text-gray-700 mb-4">
Yotae combines the strength of Taekwondo with the calming flow of yoga, offering a fun, informal experience that builds strength, flexibility, and excitement for every session.     </p>
      <div className="text-sm text-gray-800">
        <p><strong>Tue & Thur:</strong> 5:30 – 6:30 PM</p>
       
      </div>
    </div>
   
    <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition duration-300">
      <h3 className="text-2xl font-semibold text-red-600 mb-2">Advanced Yotae <br></br> (Ages 12+)</h3>
      <p className="text-gray-700 mb-4">
Yotae fuses the precision and power of Taekwondo with the mobility and recovery benefits of yoga. Designed for high-performing athletes, this dynamic practice enhances strength, flexibility, and mental focus in a challenging yet balanced environment.     </p>
      <div className="text-sm text-gray-800">
        <p><strong>Tue & Thur:</strong> 6:30 – 7:30 PM</p>
       
      </div>
    </div>
  </div>
</section>

        </main>
    );
};

export default ClassesPage;