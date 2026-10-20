// Run with server-side Netlify credentials, never in the browser.
const { NETLIFY_AUTH_TOKEN: token, NETLIFY_SITE_ID: siteId } = process.env;
if (!token || !siteId) throw new Error('Netlify credentials and site ID are required.');
async function api(path, body) {
  const response = await fetch(`https://api.netlify.com/api/v1/${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  if (!response.ok) throw new Error(`Netlify notification API failed (${response.status}).`);
  return response.json();
}
const forms = await api(`sites/${siteId}/forms`);
let hooks = await api(`hooks?site_id=${encodeURIComponent(siteId)}`);
const emails = () => hooks.filter(hook => hook.type === 'email'
  && hook.event === 'submission_created' && !hook.disabled);
function covers(hook, name) {
  if (!hook.form_id && !hook.form_name) return true;
  return hook.form_name === name || forms.some(form => form.name === name && form.id === hook.form_id);
}
let inquiry = emails().filter(hook => covers(hook, 'membership-inquiry'));
// Match the verified development site's notification destination on a new project.
if (!inquiry.length) {
  const hook = await api(`hooks?site_id=${encodeURIComponent(siteId)}`, {
    site_id: siteId, form_name: 'membership-inquiry', type: 'email',
    event: 'submission_created', data: { email: 'matt@anchorpoint.med' }
  });
  hooks.push(hook);
  inquiry = [hook];
}
for (const source of inquiry) {
  if (!source.data?.email) throw new Error('Inquiry notification has no email destination.');
  if (emails().some(hook => covers(hook, 'email-signup') && hook.data.email === source.data.email)) continue;
  hooks.push(await api(`hooks?site_id=${encodeURIComponent(siteId)}`, {
    site_id: siteId, form_name: 'email-signup', type: 'email',
    event: 'submission_created', data: source.data
  }));
}
console.log('RSVP email notifications match membership inquiry notifications.');
