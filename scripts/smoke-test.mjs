const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:3000/api/v1';

async function run() {
  const response = await fetch(`${baseUrl}/operator/dashboard`, {
    headers: { Authorization: 'Bearer dev-token' },
  });
  console.log('status', response.status);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
