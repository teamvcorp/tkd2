import React from "react";

export default function RefundPolicy() {
    return (
        <div className="mx-auto max-w-3xl px-4 py-12 text-gray-800">
            <h1 className="text-3xl font-bold mb-2">Refund &amp; Billing Policy</h1>
        
            <div className="space-y-8">
                <section>
                    <h2 className="text-xl font-semibold mb-2">1. No Refunds for Services Rendered</h2>
                    <p>
                        Due to the nature of our educational, training, and developmental services, <strong>all fees paid for services rendered are final and non-refundable</strong>. This includes, but is not limited to, tuition, registration fees, consultation sessions, workshops, online programming, and any other service provided either in-person or virtually.
                    </p>
                    <p className="mt-2">
                        By enrolling in or purchasing any service from The Von Der Becke Academy Corp, you acknowledge and agree that no refunds shall be issued for any service that has been initiated, delivered, or otherwise made available, regardless of completion status.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">2. Ongoing Billing &amp; Cancellation Policy</h2>
                    <p>
                        Unless otherwise specified in writing, services are billed on a recurring basis (e.g., weekly, monthly, or per term) and shall <strong>continue in perpetuity until canceled</strong> by the client.
                    </p>
                    <p className="mt-2">
                        Clients may request to cancel or pause future billing by providing a written notice no less than <strong>forty-eight (48) hours prior</strong> to the next scheduled billing date. Notice of cancellation must be sent via email to{" "}
                        <a href="mailto:admin@thevacorp.com" className="text-blue-600 underline">admin@thevacorp.com</a> or through the client portal, if applicable.
                    </p>
                    <p className="mt-2">
                        Failure to provide sufficient notice will result in the next billing cycle being charged as scheduled. No retroactive refunds will be issued.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">3. Modifications and Enforcement</h2>
                    <p>
                        The Von Der Becke Academy Corp reserves the right to modify this Policy at any time, provided that such modifications will not affect any fees already paid. Clients will be notified of changes to the Policy through email or publication on our official website.
                    </p>
                    <p className="mt-2">
                        We retain the right to enforce this Policy strictly and to the fullest extent permitted by law.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-semibold mb-2">4. Contact Information</h2>
                    <p>
                        For questions, billing inquiries, or cancellation requests, please contact:
                    </p>
                    <address className="not-italic mt-2">
                        <strong>The Von Der Becke Academy Corp</strong><br />
                        503 Lake Ave N<br />
                        Storm Lake, Iowa 50588<br />
                        Email: <a href="mailto:admin@thevacorp.com" className="text-blue-600 underline">admin@thevacorp.com</a><br />
                        Phone: <a href="tel:7122997124" className="text-blue-600 underline">712-299-7124</a>
                    </address>
                </section>
            </div>
            <hr className="my-10" />
        </div>
    );
}