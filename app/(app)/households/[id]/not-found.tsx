import Link from "next/link";

export default function HouseholdNotFound() {
  return (
    <div className="py-12 text-center">
      <h1 className="text-xl font-semibold text-gray-900">Household not found</h1>
      <p className="mt-2 text-gray-600">
        You may not have access or it doesn&apos;t exist.
      </p>
      <Link
        href="/households"
        className="mt-4 inline-block text-blue-600 hover:underline"
      >
        Back to households
      </Link>
    </div>
  );
}
