import {
  json,
  redirect,
  // TypeScript server restart trigger
  type ActionFunction,
  type LoaderFunction,
  type MetaFunction,
} from "@remix-run/node";
import {
  Form,
  useFetcher,
  useLoaderData,
  useActionData,
  useRevalidator,
} from "@remix-run/react";
import { useEffect, useRef } from "react";
import { query, type Statement } from "services/db.server";

// Meta function to define page metadata (title, description, etc.)
export const meta: MetaFunction = () => {
  return [
    { title: "Remix Fullstack Data Flow" },
    { name: "description", content: "Welcome to Remix Tutorial" },
  ];
};

// Using the Statement type from db.server for consistency

// Loader function that runs on the server to fetch data
export const loader: LoaderFunction = async () => {
  try {
    // Migration will be handled separately if needed

    // Query all statements from the database
    const statements = await query<Statement>("SELECT * FROM statements");
    // Return the statements as JSON
    return json(statements);
  } catch (error) {
    console.error("Loader error:", error);
    return json([]);
  }
};

// Action function to handle form submissions (create, update, delete)
export const action: ActionFunction = async ({
  request,
}: {
  request: Request;
}) => {
  // Parse the form data from the request
  const formData = await request.formData();
  // Get the intent (action type), dp_id, amount, and old_dp_id from the form
  const intent = formData.get("intent");
  const dp_id = formData.get("dp_id");
  const amount = formData.get("amount");
  const old_dp_id = formData.get("old_dp_id");
  const owner_name = formData.get("owner_name");
  const depositor_name = formData.get("depositor_name");
  const bank_name = formData.get("bank_name");
  const reconciliation = formData.get("reconciliation");
  const ref_number = formData.get("ref_number");
  const deposit_number = formData.get("deposit_number");
  const account_type = formData.get("account_type");
  const comment = formData.get("comment");

  // Handle different actions based on the intent
  if (intent === "create") {
    // Create a new statement
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
    if (!owner_name || !depositor_name || !bank_name || !reconciliation || !ref_number || !deposit_number || !account_type || !comment) {
      return json({ error: "All fields are required" }, { status: 400 });
    }

    // Convert and validate datetime
    const depositDate = new Date(deposit_date as string);
    if (isNaN(depositDate.getTime())) {
      return json({ error: "Invalid date format" }, { status: 400 });
    }
    const formattedDate = depositDate
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    await query(
      "INSERT INTO statements (dp_id, amount, deposit_date, owner_name, depositor_name, bank_name, reconciliation, ref_number, deposit_number, account_type, comment) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        dp_id?.toString().trim(),
        Number(amount),
        formattedDate,
        owner_name as string,
        depositor_name as string,
        bank_name as string,
        reconciliation as string,
        ref_number as string,
        deposit_number as string,
        account_type as string,
        comment as string
      ]
    );
  } else if (intent === "update") {
    // Update an existing statement
    await query(
      "UPDATE statements SET dp_id = ?, amount = ?, owner_name = ?, depositor_name = ?, bank_name = ?, reconciliation = ?, ref_number = ?, deposit_number = ?, account_type = ?, comment = ? WHERE dp_id = ?",
      [
        dp_id as string,
        Number(amount),
        owner_name as string,
        depositor_name as string,
        bank_name as string,
        reconciliation as string,
        ref_number as string,
        deposit_number as string,
        account_type as string,
        comment as string,
        old_dp_id as string
      ]
    );
  } else if (intent === "delete") {
    // Delete a statement
    // Use original DP ID for deletion
    if (!old_dp_id) {
      return json({ error: "Missing original DP ID" }, { status: 400 });
    }
    await query("DELETE FROM statements WHERE dp_id = ?", [
      old_dp_id as string,
    ]);
  }

  // Return a success response
  return json({ success: true });
};

// Main component that renders the page
export default function Index() {
  // Load the statements data using the loader
  const statements = useLoaderData<typeof loader>();
  // Get action data for error handling
  const actionData = useActionData<typeof action>();
  // Initialize fetcher for form submissions
  const fetcher = useFetcher();
  // Initialize revalidator to refresh data
  const revalidator = useRevalidator();
  // Create ref for the form to reset it
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form after successful submission
  useEffect(() => {
    if (
      fetcher.state === "idle" &&
      fetcher.data &&
      typeof fetcher.data === "object" &&
      !("error" in fetcher.data)
    ) {
      // Reset the form if submission was successful
      formRef.current?.reset();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Statements Manager
          </h1>
          <p className="text-gray-400">
            Create and manage your financial statements
          </p>
        </div>

        {/* Create Statement Form */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 mb-8">
          <fetcher.Form
            ref={formRef}
            method="post"
            onSubmit={() => {
              setTimeout(() => {
                revalidator.revalidate();
              }, 500);
            }}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-white">
                Create New Statement
              </h2>
            </div>

            {/* Basic Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-600 pb-2">
                Basic Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    DP ID
                  </label>
                  <input
                    name="dp_id"
                    placeholder="6 characters"
                    maxLength={6}
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deposit Date
                  </label>
                  <input
                    name="deposit_date"
                    type="datetime-local"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Personal Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-600 pb-2">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Owner Name
                  </label>
                  <input
                    name="owner_name"
                    placeholder="Account owner name"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Depositor Name
                  </label>
                  <input
                    name="depositor_name"
                    placeholder="Person making deposit"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Banking Information Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-600 pb-2">
                Banking Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Bank Name
                  </label>
                  <input
                    name="bank_name"
                    placeholder="Financial institution"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Type
                  </label>
                  <select
                    name="account_type"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  >
                    <option value="">Select account type</option>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                    <option value="business">Business</option>
                    <option value="joint">Joint</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Transaction Details Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-200 mb-4 border-b border-gray-600 pb-2">
                Transaction Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reference Number
                  </label>
                  <input
                    name="ref_number"
                    placeholder="Transaction reference"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deposit Number
                  </label>
                  <input
                    name="deposit_number"
                    placeholder="Deposit slip number"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Reconciliation
                  </label>
                  <select
                    name="reconciliation"
                    className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                    required
                  >
                    <option value="">Select status</option>
                    <option value="pending">Pending</option>
                    <option value="reconciled">Reconciled</option>
                    <option value="disputed">Disputed</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Comment Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Comment
              </label>
              <textarea
                name="comment"
                placeholder="Additional notes or comments..."
                rows={3}
                className="w-full p-3 bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                required
              />
            </div>

            {/* Error Message */}
            {actionData?.error && (
              <div className="mb-4 p-4 bg-red-900 border border-red-700 rounded-lg">
                <div className="flex items-center">
                  <span className="text-red-300 font-medium">
                    {actionData.error}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              name="intent"
              value="create"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Create Statement
            </button>
          </fetcher.Form>
        </div>

        {/* Statements List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white">
              Existing Statements
            </h2>
          </div>

          {statements.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium text-gray-300 mb-2">
                No statements yet
              </h3>
              <p className="text-gray-500">
                Create your first statement using the form above.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {statements.map((statement: Statement) => (
                <div
                  key={statement.dp_id}
                  className="border border-gray-600 rounded-lg p-6 bg-gray-700"
                >
                  <fetcher.Form method="post">
                    {/* Statement Header */}
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="px-3 py-1 bg-blue-600 rounded text-white font-bold text-sm">
                          {statement.dp_id}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">
                            ${statement.amount}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {statement.deposit_date
                              ? new Date(
                                  statement.deposit_date
                                ).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "long",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : "Date not set"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            statement.reconciliation === "reconciled"
                              ? "bg-green-100 text-green-800"
                              : statement.reconciliation === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {statement.reconciliation}
                        </span>
                      </div>
                    </div>

                    {/* Editable Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                          Basic Info
                        </h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            DP ID
                          </label>
                          <input
                            name="dp_id"
                            defaultValue={statement.dp_id}
                            className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Amount
                          </label>
                          <input
                            name="amount"
                            type="number"
                            step="0.01"
                            min="0"
                            defaultValue={statement.amount}
                            className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                          />
                        </div>
                      </div>

                      {/* Personal Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                          Personal Info
                        </h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Owner Name
                          </label>
                          <input
                            name="owner_name"
                            defaultValue={statement.owner_name}
                            className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Depositor Name
                          </label>
                          <input
                            name="depositor_name"
                            defaultValue={statement.depositor_name}
                            className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                          />
                        </div>
                      </div>

                      {/* Banking Info */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                          Banking Info
                        </h4>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Bank Name
                          </label>
                          <input
                            name="bank_name"
                            defaultValue={statement.bank_name}
                            className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Account Type
                          </label>
                          <select
                            name="account_type"
                            defaultValue={statement.account_type}
                            className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                            required
                          >
                            <option value="checking">Checking</option>
                            <option value="savings">Savings</option>
                            <option value="business">Business</option>
                            <option value="joint">Joint</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Reference Number
                        </label>
                        <input
                          name="ref_number"
                          defaultValue={statement.ref_number}
                          className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Deposit Number
                        </label>
                        <input
                          name="deposit_number"
                          defaultValue={statement.deposit_number}
                          className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-400 mb-1">
                          Reconciliation
                        </label>
                        <select
                          name="reconciliation"
                          defaultValue={statement.reconciliation}
                          className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                          required
                        >
                          <option value="pending">Pending</option>
                          <option value="reconciled">Reconciled</option>
                          <option value="disputed">Disputed</option>
                        </select>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-6">
                      <label className="block text-xs font-medium text-gray-400 mb-1">
                        Comment
                      </label>
                      <textarea
                        name="comment"
                        defaultValue={statement.comment}
                        rows={2}
                        className="w-full p-2 text-sm bg-gray-600 border border-gray-500 text-white rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400 resize-none"
                        required
                      />
                    </div>

                    {/* Action Buttons */}
                    <input
                      type="hidden"
                      name="old_dp_id"
                      value={statement.dp_id}
                    />
                    <div className="flex items-center justify-between pt-4 border-t border-gray-600">
                      <div className="flex items-center space-x-3">
                        {fetcher.state === "submitting" && (
                          <div className="flex items-center text-blue-400">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400 mr-2"></div>
                            <span className="text-sm font-medium">
                              Processing...
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          name="intent"
                          value="update"
                          className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                        >
                          Update
                        </button>
                        <button
                          type="submit"
                          name="intent"
                          value="delete"
                          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
                          onClick={(e) => {
                            if (
                              !confirm(
                                "Are you sure you want to delete this statement?"
                              )
                            ) {
                              e.preventDefault();
                            }
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </fetcher.Form>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
