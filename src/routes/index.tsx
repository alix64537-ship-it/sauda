import { createFileRoute } from "@tanstack/react-router";
import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fgpoxtpnuqqzkgiduzzr.supabase.co";
const SUPABASE_KEY = "sb_publishable_WdwOAGKEQem6SJ3PeB4Esw_mFKB_6Zk";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

interface Doctor {
  id: number;
  name: string;
  specialty: string;
  experience: string;
  clinic: string;
  rating: string;
  price: string;
  avatar: string;
}

interface Appointment {
  id: string;
  patient_name: string;
  patient_phone: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  complaints: string;
  status: string;
}

const DOCTORS: Doctor[] = [
  {
    id: 1,
    name: "Д-р Сагындыкова Айгуль Каримовна",
    specialty: "Терапевт",
    experience: "Стаж 14 лет",
    clinic: "Поликлиника №1, пр. Бухар-Жырау",
    rating: "4.9",
    price: "6 000 ₸",
    avatar: "🩺",
  },
  {
    id: 2,
    name: "Д-р Ахметов Бауыржан Маратович",
    specialty: "Кардиолог",
    experience: "Стаж 18 лет",
    clinic: "Кардиоцентр Караганда",
    rating: "5.0",
    price: "9 500 ₸",
    avatar: "❤️",
  },
  {
    id: 3,
    name: "Д-р Нурпеисова Динара Сериковна",
    specialty: "Невролог",
    experience: "Стаж 11 лет",
    clinic: "Медцентр «Гиппократ»",
    rating: "4.8",
    price: "8 000 ₸",
    avatar: "🧠",
  },
  {
    id: 4,
    name: "Д-р Ким Елена Владимировна",
    specialty: "Педиатр",
    experience: "Стаж 16 лет",
    clinic: "Детская клиника «Болашак»",
    rating: "4.9",
    price: "7 000 ₸",
    avatar: "👶",
  },
];

export const Route = createFileRoute("/")({
  component: MedCareHome,
});

function MedCareHome() {
  const [activeTab, setActiveTab] = useState<"doctors" | "records" | "calc">("doctors");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("Все");
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [date, setDate] = useState("2026-11-21");
  const [time, setTime] = useState("10:00");
  const [complaints, setComplaints] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  const [weight, setWeight] = useState("68");
  const [height, setHeight] = useState("175");
  const [sysBp, setSysBp] = useState("120");
  const [diaBp, setDiaBp] = useState("80");

  const fetchAppointments = async () => {
    setLoadingRecords(true);
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) {
      setAppointments(data);
    }
    setLoadingRecords(false);
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctor || !patientName.trim() || !patientPhone.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from("appointments").insert([
      {
        patient_name: patientName.trim(),
        patient_phone: patientPhone.trim(),
        doctor_name: selectedDoctor.name,
        specialty: selectedDoctor.specialty,
        appointment_date: date,
        appointment_time: time,
        complaints: complaints.trim() || "Плановый осмотр",
        status: "Подтверждена",
      },
    ]);

    setSubmitting(false);
    if (!error) {
      setSelectedDoctor(null);
      setPatientName("");
      setPatientPhone("");
      setComplaints("");
      await fetchAppointments();
      setActiveTab("records");
    } else {
      alert("Ошибка сохранения: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("appointments").delete().eq("id", id);
    fetchAppointments();
  };

  const w = parseFloat(weight) || 0;
  const h = (parseFloat(height) || 0) / 100;
  const bmi = h > 0 ? (w / (h * h)).toFixed(1) : "0.0";
  const bmiNum = parseFloat(bmi);
  const bmiStatus =
    bmiNum < 18.5
      ? { text: "Дефицит массы тела", color: "text-amber-600 bg-amber-50" }
      : bmiNum < 25
      ? { text: "Нормальная масса тела", color: "text-emerald-700 bg-emerald-50" }
      : bmiNum < 30
      ? { text: "Избыточная масса тела", color: "text-orange-600 bg-orange-50" }
      : { text: "Ожирение", color: "text-red-600 bg-red-50" };

  const sys = parseInt(sysBp) || 0;
  const dia = parseInt(diaBp) || 0;
  const bpStatus =
    sys < 120 && dia < 80
      ? { text: "Оптимальное АД", color: "text-emerald-700 bg-emerald-50" }
      : sys < 140 && dia < 90
      ? { text: "Нормальное / Высокое нормальное АД", color: "text-amber-700 bg-amber-50" }
      : { text: "Артериальная гипертензия — рекомендован осмотр терапевта", color: "text-red-700 bg-red-50" };

  const specialties = ["Все", "Терапевт", "Кардиолог", "Невролог", "Педиатр"];
  const filteredDoctors =
    selectedSpecialty === "Все"
      ? DOCTORS
      : DOCTORS.filter((d) => d.specialty === selectedSpecialty);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-teal-700 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white text-teal-700 font-bold text-xl flex items-center justify-center shadow">
              +
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MedCare Караганда</h1>
              <p className="text-xs text-teal-100">Цифровая клиника и запись пациентов</p>
            </div>
          </div>

          <nav className="flex gap-2 bg-teal-800/60 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("doctors")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "doctors" ? "bg-white text-teal-800 shadow" : "text-teal-100 hover:text-white"
              }`}
            >
              Врачи и запись
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                activeTab === "records" ? "bg-white text-teal-800 shadow" : "text-teal-100 hover:text-white"
              }`}
            >
              Медкарта
              <span className="px-1.5 py-0.5 text-xs rounded-full bg-teal-600 text-white">
                {appointments.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab("calc")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === "calc" ? "bg-white text-teal-800 shadow" : "text-teal-100 hover:text-white"
              }`}
            >
              Медкалькулятор
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "doctors" && (
          <div>
            <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-2xl p-6 text-white mb-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-1">Онлайн-запись к специалистам</h2>
              <p className="text-teal-50 text-sm">
                Выберите врача в Караганде и оформите электронный талон за 30 секунд.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {specialties.map((spec) => (
                <button
                  key={spec}
                  onClick={() => setSelectedSpecialty(spec)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
                    selectedSpecialty === spec
                      ? "bg-teal-700 text-white border-teal-700"
                      : "bg-white text-slate-700 border-slate-200 hover:border-teal-400"
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 text-3xl flex items-center justify-center shrink-0">
                      {doc.avatar}
                    </div>
                    <div>
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 mb-1">
                        {doc.specialty} • ★ {doc.rating}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{doc.experience}</p>
                      <p className="text-xs text-slate-500">{doc.clinic}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">Приём</span>
                      <span className="font-bold text-slate-900">{doc.price}</span>
                    </div>
                    <button
                      onClick={() => setSelectedDoctor(doc)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-medium rounded-xl transition"
                    >
                      Записаться
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "records" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Электронные талоны пациентов</h2>
                <p className="text-xs text-slate-500">Данные синхронизируются с облачной БД PostgreSQL (Supabase)</p>
              </div>
              <button
                onClick={fetchAppointments}
                className="px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-xl hover:bg-slate-100"
              >
                Обновить
              </button>
            </div>

            {loadingRecords ? (
              <p className="text-slate-500 text-sm">Загрузка записей...</p>
            ) : appointments.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
                <p className="text-slate-500 mb-3">Записей на приём пока нет</p>
                <button
                  onClick={() => setActiveTab("doctors")}
                  className="px-4 py-2 bg-teal-700 text-white rounded-xl text-sm"
                >
                  Выбрать врача
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">
                          {item.status}
                        </span>
                        <span className="text-xs font-medium text-slate-500">
                          {item.appointment_date} в {item.appointment_time}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900">
                        {item.doctor_name} ({item.specialty})
                      </h3>
                      <p className="text-sm text-slate-700 mt-1">
                        Пациент: <strong>{item.patient_name}</strong> ({item.patient_phone})
                      </p>
                      {item.complaints && (
                        <p className="text-xs text-slate-500 mt-1">Причина обращения: {item.complaints}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 text-xs text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-medium"
                    >
                      Отменить талон
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "calc" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Индекс массы тела (ИМТ)</h3>
              <p className="text-xs text-slate-500 mb-4">Скрининговая оценка по критериям ВОЗ</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Вес (кг)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Рост (см)</label>
                  <input
                    type="number"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold text-slate-900 mb-1">{bmi} кг/м²</div>
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${bmiStatus.color}`}>
                  {bmiStatus.text}
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-1">Оценка артериального давления</h3>
              <p className="text-xs text-slate-500 mb-4">Классификация уровня АД (мм рт. ст.)</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Систолическое</label>
                  <input
                    type="number"
                    value={sysBp}
                    onChange={(e) => setSysBp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Диастолическое</label>
                  <input
                    type="number"
                    value={diaBp}
                    onChange={(e) => setDiaBp(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="text-2xl font-bold text-slate-900 mb-1">
                  {sysBp} / {diaBp} мм рт. ст.
                </div>
                <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold ${bpStatus.color}`}>
                  {bpStatus.text}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-900">Запись на приём</h3>
            <p className="text-sm text-teal-700 font-medium mb-4">
              {selectedDoctor.name} • {selectedDoctor.specialty}
            </p>

            <form onSubmit={handleBook} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">ФИО пациента *</label>
                <input
                  type="text"
                  required
                  placeholder="Например: Курбанов Алихан"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Телефон *</label>
                <input
                  type="tel"
                  required
                  placeholder="+7 700 000 00 00"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Дата</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Время</label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  >
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:30">11:30</option>
                    <option value="14:00">14:00</option>
                    <option value="16:30">16:30</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Жалобы / цель визита</label>
                <input
                  type="text"
                  placeholder="Кратко опишите симптомы"
                  value={complaints}
                  onChange={(e) => setComplaints(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                                    className="flex-1 py-2.5 border border-slate-300 rounded-xl text-sm font-medium text-slate-700"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-sm font-medium"
                >
                  {submitting ? "Сохранение..." : "Подтвердить"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

                  
