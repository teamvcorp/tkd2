import React from "react";

const PrivacyPolicy: React.FC = () => (
    <main className="max-w-3xl mx-auto my-8 p-6 bg-white rounded-lg shadow-md text-gray-800">
        <h1 className="text-3xl font-bold mb-4 text-blue-700">Privacy Policy</h1>
        <p className="mb-6">
            <strong className="font-semibold text-blue-700">The Von Der Becke Academy Corp</strong>
            <span className="text-gray-700"> (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, share, and protect personal and financial information when you engage with our services, including when you make payments or participate in financial transactions through our platform.</span>
        </p>
        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">1. Information We Collect</h2>
        <h3 className="text-lg font-medium mt-4 mb-1 text-blue-500">a. Personal Information</h3>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Full name, address, phone number, and email</li>
            <li>Date of birth and identification documents (when required for regulatory or enrollment purposes)</li>
        </ul>
        <h3 className="text-lg font-medium mt-4 mb-1 text-blue-500">b. Financial Information</h3>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Payment card information (processed securely by trusted third-party providers)</li>
            <li>Bank account details (if required for refunds, transfers, or stipend disbursements)</li>
            <li>Billing history, tuition payments, and transaction records</li>
        </ul>
        <h3 className="text-lg font-medium mt-4 mb-1 text-blue-500">c. Technical and Usage Data</h3>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Device type, IP address, browser type</li>
            <li>Website or platform usage data</li>
            <li>Cookies and user interaction tracking (to improve performance)</li>
        </ul>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">2. How We Use Your Information</h2>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Process tuition and program-related payments</li>
            <li>Manage billing, receipts, refunds, or other financial transactions</li>
            <li>Support financial aid or scholarship distribution (where applicable)</li>
            <li>Comply with legal and regulatory obligations</li>
            <li>Prevent fraud and ensure system security</li>
            <li>Communicate service-related updates and respond to inquiries</li>
            <li>Improve educational and digital services</li>
        </ul>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">3. Information Sharing</h2>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li><strong className="text-blue-700">Payment processors and financial partners</strong> (e.g., Stripe, banks)</li>
            <li><strong className="text-blue-700">Third-party service providers</strong> for billing, security, and IT support</li>
            <li><strong className="text-blue-700">Regulatory bodies</strong> or authorities when legally required</li>
            <li><strong className="text-blue-700">Authorized academic or institutional partners</strong> (with your consent)</li>
        </ul>
        <p className="mb-6">
            We <strong className="text-blue-700">do not sell</strong> your personal or financial information to advertisers or third parties.
        </p>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">4. Data Security</h2>
        <p className="mb-2">
            The Von Der Becke Academy Corp uses industry-standard safeguards to protect your data, including:
        </p>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Encryption for all sensitive information</li>
            <li>Secure payment processing through PCI DSS-compliant partners</li>
            <li>Access restrictions and staff training to protect your information</li>
        </ul>
        <p className="mb-6">
            Please note that while we strive for security, no system can guarantee complete protection.
        </p>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">5. Your Rights and Choices</h2>
        <ul className="list-disc list-inside mb-4 text-gray-700">
            <li>Access and review your personal or financial data</li>
            <li>Correct or update information</li>
            <li>Request deletion of certain data (subject to legal retention requirements)</li>
            <li>Opt out of marketing communications</li>
        </ul>
        <p className="mb-6">
            To exercise your rights, please contact us at <span className="text-blue-700">[Insert Contact Email]</span>.
        </p>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">6. Data Retention</h2>
        <p className="mb-6">
            We retain personal and financial data only for as long as necessary to fulfill our educational and administrative obligations, comply with legal requirements, and support future program verification or billing.
        </p>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">7. Children’s Privacy</h2>
        <p className="mb-6">
            Our services are primarily for individuals aged 13 and above. We do not knowingly collect personal data from children under 13 without verifiable parental or guardian consent.
        </p>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">8. Policy Updates</h2>
        <p className="mb-6">
            We may update this Privacy Policy from time to time. The latest version will be posted on our website with the “Effective Date” indicated above. You will be notified of any significant changes as required by law.
        </p>

        <hr className="my-6 border-gray-200" />

        <h2 className="text-2xl font-semibold mt-8 mb-2 text-blue-600">9. Contact Us</h2>
        <address className="not-italic mb-2 text-gray-700">
            <strong className="text-blue-700">The Von Der Becke Academy Corp</strong><br />
            <span>503 Lak Ave N</span>
            <span>Email:<span className="text-blue-700">admin@thevacorp.com</span></span><br />
            <span>Phone:<span className="text-blue-700">712-299-7124</span></span>
        </address>
    </main>
);

export default PrivacyPolicy;