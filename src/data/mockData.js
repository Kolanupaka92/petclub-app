export const ago = (d) => {
  const x = new Date();
  x.setDate(x.getDate() - d);
  return x.toISOString().split("T")[0];
};
export const future = (d) => {
  const x = new Date();
  x.setDate(x.getDate() + d);
  return x.toISOString().split("T")[0];
};
export const fmtDate = (s) => {
  try {
    return new Date(s).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return s || "—";
  }
};
export const daysAgo = (s) => {
  try {
    return Math.floor((Date.now() - new Date(s)) / 864e5);
  } catch {
    return 9999;
  }
};
export const within = (s, d) => daysAgo(s) <= d;

export const TC = {
  grooming: { dot: "bg-blue-500", light: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700", btn: "bg-blue-500 hover:bg-blue-600", border: "border-blue-200" },
  training: { dot: "bg-purple-500", light: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100 text-purple-700", btn: "bg-purple-500 hover:bg-purple-600", border: "border-purple-200" },
  food: { dot: "bg-green-500", light: "bg-green-50", text: "text-green-600", badge: "bg-green-100 text-green-700", btn: "bg-green-500 hover:bg-green-600", border: "border-green-200" },
  vet: { dot: "bg-red-500", light: "bg-red-50", text: "text-red-600", badge: "bg-red-100 text-red-700", btn: "bg-red-500 hover:bg-red-600", border: "border-red-200" },
};

export const INIT_CUSTOMER = {
  name: "Rahul Sharma",
  email: "rahul.sharma@gmail.com",
  phone: "+91 98765 43210",
  city: "Hyderabad",
  address: "Richardson, TX 75082",
  since: "Jan 2023",
  avatar: "👨",
};

export const INIT_PETS = [
  {
    id: "p1",
    name: "Bruno",
    species: "dog",
    breed: "Labrador Retriever",
    age: "3 yrs",
    dob: "2022-03-15",
    weight: "28 kg",
    gender: "Male",
    color: "Golden",
    chip: "IND-2022-03892",
    records: {
      grooming: [
        { id: "g1", date: ago(15), by: "Arjun Mehta", service: "Full Groom", cost: "₹999", notes: "Breed cut, herbal bath", rating: 5 },
        { id: "g2", date: ago(60), by: "Rohan Das", service: "Basic Groom", cost: "₹599", notes: "Bath & brush, nail trim", rating: 4 },
      ],
      training: [
        { id: "t1", date: ago(10), by: "Priya Sharma", session: "Advanced Obedience", notes: "Excellent 'stay' progress", rating: 5 },
      ],
      food: [{ id: "f1", date: ago(5), brand: "Royal Canin", ftype: "Dry", product: "Labrador Adult 30", qty: "3 kg", cost: "₹2,199", notes: "Monthly order" }],
      vet: [
        { id: "v1", date: ago(30), vet: "Dr. Kavitha R.", clinic: "PetCare Clinic, Andheri", vtype: "Vaccination", detail: "Rabies Booster", nextDue: future(335), cost: "₹450", notes: "Annual rabies booster" },
      ],
    },
  },
  {
    id: "p2",
    name: "Mochi",
    species: "cat",
    breed: "Persian",
    age: "2 yrs",
    dob: "2023-06-10",
    weight: "4.2 kg",
    gender: "Female",
    color: "White",
    chip: "IND-2023-07234",
    records: {
      grooming: [{ id: "g1", date: ago(20), by: "Sunita Rao", service: "Full Groom", cost: "₹799", notes: "Lion cut for summer", rating: 5 }],
      training: [{ id: "t1", date: ago(40), by: "Priya Sharma", session: "Litter Training", notes: "Fully litter trained now!", rating: 5 }],
      food: [{ id: "f1", date: ago(8), brand: "Me-O", ftype: "Wet", product: "Tuna & Salmon", qty: "24 sachets", cost: "₹960", notes: "Favourite flavour" }],
      vet: [{ id: "v1", date: ago(25), vet: "Dr. Shalini Menon", clinic: "Whiskers Clinic, Bandra", vtype: "Vaccination", detail: "FVRCP Booster", nextDue: future(340), cost: "₹550", notes: "Annual cat booster" }],
    },
  },
];
