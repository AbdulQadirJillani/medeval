// app/privacy-policy/page.tsx

import Head from 'next/head';

const PrivacyPolicyPage = () => {
  return (
    <>
      <Head>
        <title>Privacy Policy | MedEval</title>
        <meta
          name="description"
          content="Read MedEval's Privacy Policy to understand how we collect, use, and protect your data."
        />
      </Head>

      <main className="prose lg:prose-xl max-w-4xl mx-auto px-4 py-8">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> May 11, 2025</p>

        <p>
          This Privacy Policy explains how MedEval collects, uses, discloses, and protects your information when you visit our website. By using our Service, you agree to the terms outlined in this policy.
        </p>

        <h2>Interpretation and Definitions</h2>

        <h3>Interpretation</h3>
        <p>
          Words with initial capital letters have meanings defined below. The following definitions apply regardless of whether they appear in singular or plural.
        </p>

        <h3>Definitions</h3>
        <ul>
          <li><strong>Account:</strong> A unique account created to access our Service.</li>
          <li><strong>Company:</strong> Refers to MedEval (“the Company”, “We”, “Us”, or “Our”).</li>
          <li><strong>Cookies:</strong> Small files stored on your device that hold browsing data.</li>
          <li><strong>Device:</strong> Any device that can access the Service (e.g., computer, phone, tablet).</li>
          <li><strong>Personal Data:</strong> Information that identifies or can be used to identify an individual.</li>
          <li><strong>Service:</strong> The website and services provided by MedEval.</li>
          <li><strong>Service Provider:</strong> Any third-party company that processes data on behalf of MedEval.</li>
          <li><strong>Usage Data:</strong> Data collected automatically when using the Service.</li>
          <li>
            <strong>Website:</strong> Refers to MedEval, accessible from{' '}
            <a href="https://lolz-beige.vercel.app" target="_blank" rel="noopener noreferrer">
              https://lolz-beige.vercel.app
            </a>
          </li>
          <li><strong>You:</strong> The individual accessing or using the Service, or the company on whose behalf the individual is using the Service.</li>
        </ul>

        <h2>Types of Data Collected</h2>

        <h3>Personal Data</h3>
        <p>
          While using our Service, we may ask you to provide certain personally identifiable information including, but not limited to:
        </p>
        <ul>
          <li>Email address</li>
          <li>First and last name</li>
          <li>Usage data</li>
        </ul>

        <h3>Usage Data</h3>
        <p>Usage Data is collected automatically and may include information such as:</p>
        <ul>
          <li>Your device’s IP address</li>
          <li>Browser type and version</li>
          <li>Pages you visit</li>
          <li>Time and date of your visit</li>
          <li>Unique device identifiers</li>
        </ul>

        <h2>Use of Your Personal Data</h2>
        <p>MedEval may use Personal Data for the following purposes:</p>
        <ul>
          <li>To provide and maintain our Service</li>
          <li>To manage your Account</li>
          <li>To contact you with updates, offers, and security alerts</li>
          <li>To analyze usage for service improvement</li>
        </ul>

        <h2>Disclosure of Your Personal Data</h2>
        <p>
          We may share your personal data with service providers, affiliates, or in a merger/acquisition scenario. We will never sell your data.
        </p>

        <h2>Retention of Your Personal Data</h2>
        <p>
          We retain your personal data only as long as necessary for the purposes set out in this Privacy Policy. When data is no longer needed, we securely delete or anonymize it.
        </p>

        <h2>Security of Your Personal Data</h2>
        <p>
          The security of your data is important to us, but remember that no method of transmission over the Internet is 100% secure. We use commercially acceptable means to protect your data.
        </p>

        <h2>Children’s Privacy</h2>
        <p>
          Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under 13.
        </p>

        <h2>Your Data Protection Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal data</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Object to or restrict data processing</li>
        </ul>

        <h2>Links to Other Websites</h2>
        <p>
          Our Service may contain links to third-party sites. We are not responsible for the content or privacy practices of those sites. Please review their policies separately.
        </p>

        <h2>Changes to This Privacy Policy</h2>
        <p>
          We may update this policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the Last updated date.
        </p>

        <h2>Contact Us</h2>
        <p>If you have questions about this Privacy Policy, you can contact us at:</p>
        <ul>
          <li>Email: contact@medevel.app</li>
        </ul>
      </main>
    </>
  );
};

export default PrivacyPolicyPage;