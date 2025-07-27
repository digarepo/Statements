import {
  json,
  redirect,
  // TypeScript server restart trigger
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import { Form, useFetcher, useLoaderData, useActionData } from "@remix-run/react";
import { query } from "services/db.server";

// Meta function to define page metadata (title, description, etc.)
export const meta: MetaFunction = () => {
  return [
    { title: "Remix Fullstack Data Flow" },
    { name: "description", content: "Welcome to Remix Tutorial" },
  ];
};

// Type definition for the User object
type User = {
  dp_id: string;
  amount: number;
  deposit_date: string | null;
};

// Loader function that runs on the server to fetch data
export const loader: LoaderFunction = async () => {
  try {
    // Migration will be handled separately if needed

    // Query all users from the database
    const users = await query("SELECT * FROM users");
    // Return the users as JSON
    return json(users);
  } catch (error) {
    console.error("Loader error:", error);
    return json([]);
  }
};

// Action function to handle form submissions (create, update, delete)
export const action: ActionFunction = async ({ request }: { request: Request }) => {
  // Parse the form data from the request
  const formData = await request.formData();
  // Get the intent (action type), dp_id, amount, and old_dp_id from the form
  const intent = formData.get("intent");
  const dp_id = formData.get("dp_id");
  const amount = formData.get("amount");
  const old_dp_id = formData.get("old_dp_id");

  // Handle different actions based on the intent
  if (intent === "create") {
    // Create a new user
    const deposit_date = formData.get("deposit_date");
    // Validate required fields
    if (!dp_id || dp_id.toString().length !== 6) {
      return json({ error: "DP ID must be 6 characters" }, { status: 400 });
    }
    if (!amount || isNaN(Number(amount))) {
      return json({ error: "Valid amount is required" }, { status: 400 });
    }
    if (!deposit_date) {
      return json({ error: "Deposit date is required" }, { status: 400 });
    }

    // Convert and validate datetime
    const depositDate = new Date(deposit_date as string);
    if (isNaN(depositDate.getTime())) {
      return json({ error: "Invalid date format" }, { status: 400 });
    }
    const formattedDate = depositDate.toISOString().slice(0, 19).replace('T', ' ');
    
    await query(
      "INSERT INTO users (dp_id, amount, deposit_date) VALUES (?, ?, ?)",
      [
        dp_id?.toString().trim(), 
        Number(amount), 
        formattedDate
      ]
    );
  } else if (intent === "update") {
    // Update an existing user
    await query(
      "UPDATE users SET dp_id = ?, amount = ? WHERE dp_id = ?",
      [dp_id as string, Number(amount), old_dp_id as string]
    );
  } else if (intent === "delete") {
    // Delete a user
    // Use original DP ID for deletion
    if (!old_dp_id) {
      return json({ error: "Missing original DP ID" }, { status: 400 });
    }
    await query("DELETE FROM users WHERE dp_id = ?", [old_dp_id as string]);
  }

  // Return a success response
  return json({ success: true });
};

// Main component that renders the page
export default function Index() {
  // Load the users data using the loader
  const users = useLoaderData<typeof loader>();
  // Get action data for error handling
  const actionData = useActionData<typeof action>();
  // Initialize fetcher for form submissions
  const fetcher = useFetcher();
  
  return (
    <div className="max-w-md mx-auto p-4">
      {/* Create User Form */}
      <Form 
        method="post" 
        className="mb-8 p-4 border rounded"
      >
        <h2 className="text-lg font-bold mb-2">Create User</h2>
        {/* DP ID input */}
        <input
          name="dp_id"
          placeholder="DP ID (6 chars)"
          maxLength={6}
          className="w-full p-2 border mb-2"
          required
        />
        {/* Amount input */}
        <input
          name="amount"
          type="number"
          placeholder="Amount"
          className="w-full p-2 border mb-2"
          required
        />
        <input
          name="deposit_date"
          type="datetime-local"
          className="w-full p-2 border mb-2"
          required
        />
        {/* Show error message if any */}
        {actionData?.error && (
          <div className="text-red-500 text-sm mb-2">{actionData.error}</div>
        )}
        {/* Create button */}
        <button
          type="submit"
          name="intent"
          value="create"
          className="bg-blue-500 text-white p-2 rounded"
        >
          Create
        </button>
      </Form>

      {/* Users List */}
      <div className="space-y-4">
        {/* Map through each user and render their details */}
        {users.map((user: User) => (
          <div key={user.dp_id} className="p-4 border rounded ">
            <fetcher.Form method="post" className="flex gap-2">
              {/* Editable DP ID field */}
              <input
                name="dp_id"
                defaultValue={user.dp_id}
                className="w-20 p-2 border mb-2"
                placeholder="DP ID"
                required
              />
              {/* Editable Amount field */}
              <input
                name="amount"
                type="number"
                defaultValue={user.amount}
                className="w-24 p-2 border mb-2"
                placeholder="Amount"
                required
              />
              {/* Display deposit date (read-only) */}
              <div className="w-32 p-2 border mb-2 bg-gray-100">
                {user.deposit_date
                  ? new Date(user.deposit_date).toLocaleDateString()
                  : "Not set"}
              </div>

              {/* Hidden field to store the original DP ID for updates */}
              <input type="hidden" name="old_dp_id" value={user.dp_id} />
              <div className="flex gap-2 items-center">
                {fetcher.state === "submitting" && (
                  <span className="text-sm text-gray-500">Processing...</span>
                )}
                {/* Update button */}
                <button
                  type="submit"
                  name="intent"
                  value="update"
                  className="bg-green-500 text-white p-2 rounded flex-1"
                >
                  Update
                </button>
                {/* Delete button */}
                <button
                  type="submit"
                  name="intent"
                  value="delete"
                  className="bg-red-500 text-white p-2 rounded flex-1"
                >
                  Delete
                </button>
              </div>
            </fetcher.Form>
          </div>
        ))}
      </div>
    </div>
  );
}
