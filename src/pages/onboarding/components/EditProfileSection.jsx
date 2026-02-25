export default function EditProfileSection({
  userData,
  handleInputChange,
  handleCancel,
  handleSave,
  isSaving,
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow max-w-3xl mx-auto">
      <h2 className="text-xl font-semibold mb-6">Edit Profile Information</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Full Name"
          name="fullName"
          value={userData.fullName}
          onChange={handleInputChange}
        />

        <Input
          label="Username"
          name="username"
          value={userData.username}
          onChange={handleInputChange}
        />

        <Input
          label="Email"
          name="email"
          value={userData.email}
          onChange={handleInputChange}
        />

        <Input
          label="Phone"
          name="phone"
          value={userData.phone}
          onChange={handleInputChange}
        />
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={handleCancel} className="px-4 py-2 border rounded-lg">
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function Input({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm text-gray-500 mb-1">{label}</label>
      <input
        {...props}
        className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
      />
    </div>
  );
}
