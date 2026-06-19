import { useState } from "react";
import { createEvent } from "../services/api";

function EventForm() {
  const [formData, setFormData] = useState({
    name: "",
    employeeId: "",
    eventName: "",
    location: "",
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,

      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await createEvent(formData);

      console.log(response.data);

      alert("Event Saved Successfully");
    } catch (error) {
      console.log(error);

      alert("Something went wrong");
    }
  };

  return (
    <div>
      <h1>Event Registration</h1>

      <form onSubmit={handleSubmit}>
        <label>Name</label>
        <input name="name" value={formData.name} onChange={handleChange} />

        <label>Employee ID</label>
        <input
          name="employeeId"
          value={formData.employeeId}
          onChange={handleChange}
        />

        <label>Event Name</label>
        <input
          name="eventName"
          value={formData.eventName}
          onChange={handleChange}
        />

        <label>Location</label>
        <input
          name="location"
          value={formData.location}
          onChange={handleChange}
        />

        <label>Start Date</label>
        <input
          type="date"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
        />

        <label>End Date</label>
        <input
          type="date"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
        />

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}

export default EventForm;
