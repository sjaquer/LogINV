import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'fs';
import { GoogleAuth } from 'google-auth-library';

async function deployRules() {
    const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');

    const auth = new GoogleAuth({
        credentials: {
            client_email: clientEmail,
            private_key: privateKey,
            project_id: projectId
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform', 'https://www.googleapis.com/auth/firebase']
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const token = tokenResponse.token;

    console.log('Obtained access token for project:', projectId);

    const rulesContent = fs.readFileSync('firestore.rules', 'utf8');

    // 1. Create ruleset
    console.log('Creating ruleset...');
    const createRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            source: {
                files: [
                    {
                        name: 'firestore.rules',
                        content: rulesContent
                    }
                ]
            }
        })
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
        console.error('Failed to create ruleset:', createData);
        return;
    }

    console.log('Ruleset created:', createData.name);

    // 2. Update release cloud.firestore
    console.log('Releasing ruleset for cloud.firestore...');
    const releaseRes = await fetch(`https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            release: {
                name: `projects/${projectId}/releases/cloud.firestore`,
                rulesetName: createData.name
            }
        })
    });

    const releaseData = await releaseRes.json();
    if (!releaseRes.ok) {
        console.error('Failed to update release:', releaseData);
        return;
    }

    console.log('✅ Successfully deployed firestore.rules to Firebase!', releaseData);
}

deployRules().catch(console.error);
