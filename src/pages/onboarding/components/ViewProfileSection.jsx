export default function ViewProfileSection({ userData, onEdit }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Profile Information</h2>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Edit Profile
        </button>
      </div>

      <div className="space-y-4">
        <Info label="Full Name" value={userData.fullName} />
        <Info label="Username" value={userData.username} />
        <Info label="Email" value={userData.email} />
        <Info label="Phone" value={userData.phone} />
        <Info
          label="Roles"
          value={userData.roles.map((r) => r.role_name).join(", ")}
        />
        <Info label="Last Login" value={userData.lastLogin} />
        <Info label="Created At" value={userData.createdAt} />
      </div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-base font-medium">{value || "—"}</p>
    </div>
  );
}
