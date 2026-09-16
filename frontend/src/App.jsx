import { useCallback, useEffect, useMemo, useState } from "react";
import { apiRequest } from "./api";
import "./App.css";

const SEEDED_TECHNICIANS = [
  { technicianId: "TECH-001", fullName: "Nguyen Minh Anh" },
  { technicianId: "TECH-002", fullName: "Tran Quoc Bao" },
  { technicianId: "TECH-003", fullName: "Le Thu Ha" },
];

function formatDate(value) {
  if (!value) return "Not provided";

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value) {
  if (!value) return "Not provided";

  return new Intl.DateTimeFormat("en-AU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatTime(value) {
  return value ? value.slice(0, 5) : "—";
}

function formatMoney(value) {
  if (value === null || value === undefined) return "Not recorded";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

const EMPTY_BOOKING_FORM = {
  customerId: "",
  customerFullName: "",
  serviceId: "",
  issueDescription: "",
  preferredServiceDate: "",
  availableStartTime: "09:00",
  availableEndTime: "10:00",
  streetNumber: "",
  streetName: "",
  ward: "",
  provinceCode: "",
  provinceName: "",
};

function todayAsInputValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function App() {
  const [view, setView] = useState("queue");
  const [bookings, setBookings] = useState([]);
  const [queueLoading, setQueueLoading] = useState(true);
  const [queueError, setQueueError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [visibleCount, setVisibleCount] = useState(24);

  const [searchRef, setSearchRef] = useState("");
  const [booking, setBooking] = useState(null);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [workflowError, setWorkflowError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const [estimatedServiceFee, setEstimatedServiceFee] = useState("");
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [technicianIds, setTechnicianIds] = useState([]);
  const [completedServiceFee, setCompletedServiceFee] = useState("");
  const [materialCost, setMaterialCost] = useState("");

  const [services, setServices] = useState([]);
  const [catalogueLoading, setCatalogueLoading] = useState(true);
  const [catalogueError, setCatalogueError] = useState("");
  const [bookingForm, setBookingForm] = useState(EMPTY_BOOKING_FORM);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createdBooking, setCreatedBooking] = useState(null);

  const visibleBookings = useMemo(
    () => bookings.slice(0, visibleCount),
    [bookings, visibleCount],
  );

  const loadQueue = useCallback(async (signal) => {
    setQueueLoading(true);
    setQueueError("");

    try {
      const body = await apiRequest("/bookings?status=CREATED", { signal });
      const items = Array.isArray(body) ? body : body?.items || [];

      setBookings(items);
      setVisibleCount(24);
      setLastUpdated(new Date());
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setQueueError(
          requestError.message || "Unable to load the booking queue.",
        );
      }
    } finally {
      if (!signal?.aborted) {
        setQueueLoading(false);
      }
    }
  }, []);

  const loadServices = useCallback(async (signal) => {
    setCatalogueLoading(true);
    setCatalogueError("");

    try {
      const body = await apiRequest("/repair-services?activeOnly=true", {
        signal,
      });
      const items = Array.isArray(body) ? body : body?.items || [];
      setServices(items.filter((service) => service.isActive !== false));
    } catch (requestError) {
      if (requestError.name !== "AbortError") {
        setCatalogueError(
          requestError.message || "Unable to load the service catalogue.",
        );
      }
    } finally {
      if (!signal?.aborted) setCatalogueLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const requestTimer = window.setTimeout(
      () => loadQueue(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(requestTimer);
      controller.abort();
    };
  }, [loadQueue]);

  useEffect(() => {
    const controller = new AbortController();
    const requestTimer = window.setTimeout(
      () => loadServices(controller.signal),
      0,
    );

    return () => {
      window.clearTimeout(requestTimer);
      controller.abort();
    };
  }, [loadServices]);

  function updateBookingForm(event) {
    const { name, value } = event.target;
    setBookingForm((current) => ({ ...current, [name]: value }));
  }

  async function handleCreateBooking(event) {
    event.preventDefault();
    setCreateError("");
    setCreatedBooking(null);

    const [startHour, startMinute] = bookingForm.availableStartTime
      .split(":")
      .map(Number);
    const [endHour, endMinute] = bookingForm.availableEndTime
      .split(":")
      .map(Number);

    if (endHour * 60 + endMinute - (startHour * 60 + startMinute) < 60) {
      setCreateError("The available time window must be at least 60 minutes.");
      return;
    }

    setCreateLoading(true);

    try {
      const result = await apiRequest("/bookings", {
        method: "POST",
        body: JSON.stringify({
          customerId: bookingForm.customerId.trim(),
          customerFullName: bookingForm.customerFullName.trim(),
          serviceId: bookingForm.serviceId,
          issueDescription: bookingForm.issueDescription.trim(),
          preferredServiceDate: bookingForm.preferredServiceDate,
          availableStartTime: bookingForm.availableStartTime,
          availableEndTime: bookingForm.availableEndTime,
          serviceAddress: {
            streetNumber: bookingForm.streetNumber.trim(),
            streetName: bookingForm.streetName.trim(),
            ward: bookingForm.ward.trim(),
            provinceCode: bookingForm.provinceCode.trim() || null,
            provinceName: bookingForm.provinceName.trim() || null,
          },
          originChannel: "SBP",
        }),
      });

      setCreatedBooking(result);
      setBookingForm(EMPTY_BOOKING_FORM);
      loadQueue();
    } catch (requestError) {
      setCreateError(requestError.message || "Unable to create the booking.");
    } finally {
      setCreateLoading(false);
    }
  }

  function openCreatedBooking() {
    if (!createdBooking?.bookingRef) return;
    setView("workflow");
    setSearchRef(createdBooking.bookingRef);
    loadBooking(createdBooking.bookingRef);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function loadBooking(reference = searchRef) {
    const trimmedReference = reference.trim();

    if (!trimmedReference) {
      setWorkflowError("Enter a booking reference.");
      return;
    }

    setWorkflowLoading(true);
    setWorkflowError("");
    setNotice("");

    try {
      const result = await apiRequest(
        `/bookings/${encodeURIComponent(trimmedReference)}`,
      );

      setSearchRef(trimmedReference);
      setBooking(result);
    } catch (requestError) {
      setBooking(null);
      setWorkflowError(
        requestError.message || "Unable to retrieve the booking.",
      );
    } finally {
      setWorkflowLoading(false);
    }
  }

  function openBooking(reference) {
    setView("workflow");
    setSearchRef(reference);
    loadBooking(reference);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submitTransition(path, payload, successMessage) {
    setActionLoading(true);
    setWorkflowError("");
    setNotice("");

    try {
      const result = await apiRequest(
        `/bookings/${encodeURIComponent(booking.bookingRef)}${path}`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
      );

      setBooking(result);
      setNotice(successMessage);
      loadQueue();
    } catch (requestError) {
      setWorkflowError(requestError.message || "Unable to update the booking.");
    } finally {
      setActionLoading(false);
    }
  }

  function handleConfirmation(event) {
    event.preventDefault();

    submitTransition(
      "/confirmation",
      {
        estimatedServiceFee: Number(estimatedServiceFee),
        estimatedDurationMinutes: Number(estimatedDurationMinutes),
      },
      "Booking confirmed successfully.",
    );
  }

  function handleTechnicianChange(technicianId) {
    setTechnicianIds((currentIds) =>
      currentIds.includes(technicianId)
        ? currentIds.filter((id) => id !== technicianId)
        : [...currentIds, technicianId],
    );
  }

  function handleScheduling(event) {
    event.preventDefault();

    if (technicianIds.length === 0) {
      setWorkflowError("Select at least one Technician.");
      return;
    }

    submitTransition(
      "/schedule",
      {
        scheduledAt,
        technicianIds,
      },
      "Booking scheduled successfully.",
    );
  }

  function handleCompletion(event) {
    event.preventDefault();

    submitTransition(
      "/completion",
      {
        completedServiceFee: Number(completedServiceFee),
        materialCost: Number(materialCost),
      },
      "Booking completed successfully.",
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">F</span>
          <div>
            <strong>Fixinh</strong>
            <span>Service Management Portal</span>
          </div>
        </div>

        <nav className="nav-tabs" aria-label="Portal navigation">
          <button
            type="button"
            className={view === "book" ? "active" : ""}
            onClick={() => setView("book")}
          >
            Book service
          </button>

          <button
            type="button"
            className={view === "queue" ? "active" : ""}
            onClick={() => setView("queue")}
          >
            Reception queue
          </button>

          <button
            type="button"
            className={view === "workflow" ? "active" : ""}
            onClick={() => setView("workflow")}
          >
            Booking workflow
          </button>
        </nav>
      </header>

      <main>
        {view === "book" && (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">Customer booking</p>
                <h1>Book a repair service</h1>
                <p className="subtitle">
                  Choose an active service and provide the customer’s preferred
                  visit details.
                </p>
              </div>
            </section>

            {catalogueLoading && (
              <section className="state-card compact-state" aria-live="polite">
                <div className="spinner" />
                <div>
                  <h2>Loading service catalogue</h2>
                  <p>Retrieving the currently available repair services.</p>
                </div>
              </section>
            )}

            {!catalogueLoading && catalogueError && (
              <section
                className="state-card error-card compact-state"
                role="alert"
              >
                <div>
                  <h2>Catalogue unavailable</h2>
                  <p>{catalogueError}</p>
                </div>
                <button type="button" onClick={() => loadServices()}>
                  Try again
                </button>
              </section>
            )}

            {!catalogueLoading && !catalogueError && (
              <div className="booking-form-layout">
                <section className="catalogue-panel">
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Service catalogue</p>
                      <h2>Available services</h2>
                    </div>
                    <span>{services.length} active</span>
                  </div>

                  {services.length === 0 ? (
                    <p className="catalogue-empty">
                      No active repair services are currently available.
                    </p>
                  ) : (
                    <div className="service-list">
                      {services.map((service) => (
                        <label
                          className={`service-option ${
                            bookingForm.serviceId === service.serviceId
                              ? "selected"
                              : ""
                          }`}
                          key={service.serviceId}
                        >
                          <input
                            type="radio"
                            name="serviceId"
                            value={service.serviceId}
                            required
                            checked={
                              bookingForm.serviceId === service.serviceId
                            }
                            onChange={updateBookingForm}
                          />
                          <span>
                            <strong>{service.serviceName}</strong>
                            <small>{service.categoryName}</small>
                          </span>
                          <span className="service-meta">
                            <strong>
                              {formatMoney(service.baseServiceFee)}
                            </strong>
                            <small>
                              {service.standardDurationMinutes} minutes
                            </small>
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </section>

                <form
                  className="create-booking-form"
                  onSubmit={handleCreateBooking}
                >
                  <div className="section-heading">
                    <div>
                      <p className="eyebrow">Booking request</p>
                      <h2>Customer and visit details</h2>
                    </div>
                  </div>

                  {createError && (
                    <div className="message error-message" role="alert">
                      {createError}
                    </div>
                  )}

                  {createdBooking && (
                    <div className="created-booking" role="status">
                      <div>
                        <span>Booking created successfully</span>
                        <strong>{createdBooking.bookingRef}</strong>
                        <small>{createdBooking.message}</small>
                      </div>
                      <button type="button" onClick={openCreatedBooking}>
                        Open workflow
                      </button>
                    </div>
                  )}

                  <div className="form-grid">
                    <label>
                      Customer ID
                      <input
                        name="customerId"
                        required
                        value={bookingForm.customerId}
                        onChange={updateBookingForm}
                        placeholder="CUST-001"
                      />
                    </label>

                    <label>
                      Customer full name
                      <input
                        name="customerFullName"
                        required
                        value={bookingForm.customerFullName}
                        onChange={updateBookingForm}
                        placeholder="Customer name"
                      />
                    </label>

                    <label className="form-span">
                      Issue description
                      <textarea
                        name="issueDescription"
                        required
                        minLength="10"
                        maxLength="1000"
                        rows="4"
                        value={bookingForm.issueDescription}
                        onChange={updateBookingForm}
                        placeholder="Describe the repair issue in at least 10 characters."
                      />
                    </label>

                    <label>
                      Preferred service date
                      <input
                        type="date"
                        name="preferredServiceDate"
                        required
                        min={todayAsInputValue()}
                        value={bookingForm.preferredServiceDate}
                        onChange={updateBookingForm}
                      />
                    </label>

                    <div className="time-fields">
                      <label>
                        Available from
                        <input
                          type="time"
                          name="availableStartTime"
                          required
                          value={bookingForm.availableStartTime}
                          onChange={updateBookingForm}
                        />
                      </label>
                      <label>
                        Available until
                        <input
                          type="time"
                          name="availableEndTime"
                          required
                          value={bookingForm.availableEndTime}
                          onChange={updateBookingForm}
                        />
                      </label>
                    </div>

                    <label>
                      Street number
                      <input
                        name="streetNumber"
                        required
                        value={bookingForm.streetNumber}
                        onChange={updateBookingForm}
                        placeholder="25"
                      />
                    </label>

                    <label>
                      Street name
                      <input
                        name="streetName"
                        required
                        value={bookingForm.streetName}
                        onChange={updateBookingForm}
                        placeholder="Nguyen Hue Street"
                      />
                    </label>

                    <label>
                      Ward
                      <input
                        name="ward"
                        required
                        value={bookingForm.ward}
                        onChange={updateBookingForm}
                        placeholder="Ward 1"
                      />
                    </label>

                    <label>
                      Province code
                      <input
                        name="provinceCode"
                        value={bookingForm.provinceCode}
                        onChange={updateBookingForm}
                        placeholder="HCM"
                      />
                    </label>

                    <label className="form-span">
                      Province name
                      <input
                        name="provinceName"
                        required={!bookingForm.provinceCode.trim()}
                        value={bookingForm.provinceName}
                        onChange={updateBookingForm}
                        placeholder="Ho Chi Minh City (optional when code is provided)"
                      />
                    </label>
                  </div>

                  <div className="form-footer">
                    <span>Origin channel: SBP</span>
                    <button
                      type="submit"
                      disabled={createLoading || services.length === 0}
                    >
                      {createLoading ? "Creating booking…" : "Create booking"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}

        {view === "queue" && (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">Booking operations</p>
                <h1>Reception queue</h1>
                <p className="subtitle">
                  Review newly created service bookings awaiting confirmation.
                </p>
              </div>

              <button
                className="refresh-button"
                type="button"
                onClick={() => loadQueue()}
                disabled={queueLoading}
              >
                {queueLoading ? "Refreshing…" : "Refresh queue"}
              </button>
            </section>

            <section className="summary-card" aria-label="Queue summary">
              <div>
                <span>Awaiting confirmation</span>
                <strong>{queueLoading ? "—" : bookings.length}</strong>
              </div>

              <p>
                {lastUpdated
                  ? `Updated ${lastUpdated.toLocaleTimeString("en-AU", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}`
                  : "Waiting for API response"}
              </p>
            </section>

            {queueLoading && (
              <section className="state-card" aria-live="polite">
                <div className="spinner" />
                <div>
                  <h2>Loading bookings</h2>
                  <p>Connecting to the SMT booking service.</p>
                </div>
              </section>
            )}

            {!queueLoading && queueError && (
              <section className="state-card error-card" role="alert">
                <div>
                  <h2>Queue unavailable</h2>
                  <p>{queueError}</p>
                </div>

                <button type="button" onClick={() => loadQueue()}>
                  Try again
                </button>
              </section>
            )}

            {!queueLoading && !queueError && bookings.length === 0 && (
              <section className="state-card empty-card">
                <div>
                  <h2>No bookings are waiting</h2>
                  <p>The CREATED booking queue is currently empty.</p>
                </div>
              </section>
            )}

            {!queueLoading && !queueError && bookings.length > 0 && (
              <>
                <p className="result-count">
                  Showing {visibleBookings.length} of {bookings.length} bookings
                </p>

                <section className="booking-grid" aria-label="Created bookings">
                  {visibleBookings.map((queueBooking) => (
                    <article
                      className="booking-card"
                      key={queueBooking.bookingRef}
                    >
                      <div className="booking-card-header">
                        <div>
                          <span className="reference-label">
                            Booking reference
                          </span>
                          <h2>{queueBooking.bookingRef}</h2>
                        </div>

                        <span className="status-badge">
                          {queueBooking.status}
                        </span>
                      </div>

                      <dl className="booking-details">
                        <div>
                          <dt>Customer</dt>
                          <dd>
                            {queueBooking.customerFullName ||
                              queueBooking.customerId}
                          </dd>
                        </div>

                        <div>
                          <dt>Service</dt>
                          <dd>
                            {queueBooking.serviceName || queueBooking.serviceId}
                          </dd>
                        </div>

                        <div>
                          <dt>Preferred date</dt>
                          <dd>
                            {formatDate(queueBooking.preferredServiceDate)}
                          </dd>
                        </div>

                        <div>
                          <dt>Available time</dt>
                          <dd>
                            {formatTime(queueBooking.availableStartTime)}–
                            {formatTime(queueBooking.availableEndTime)}
                          </dd>
                        </div>
                      </dl>

                      {queueBooking.issueDescription && (
                        <div className="issue">
                          <span>Customer notes</span>
                          <p>{queueBooking.issueDescription}</p>
                        </div>
                      )}

                      <button
                        type="button"
                        className="card-action"
                        onClick={() => openBooking(queueBooking.bookingRef)}
                      >
                        Open booking
                      </button>
                    </article>
                  ))}
                </section>

                {visibleCount < bookings.length && (
                  <div className="load-more">
                    <button
                      type="button"
                      onClick={() =>
                        setVisibleCount((currentCount) => currentCount + 24)
                      }
                    >
                      Load more bookings
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {view === "workflow" && (
          <>
            <section className="page-heading">
              <div>
                <p className="eyebrow">Booking operations</p>
                <h1>Booking workflow</h1>
                <p className="subtitle">
                  Retrieve a booking and complete its valid next transition.
                </p>
              </div>
            </section>

            <form
              className="search-card"
              onSubmit={(event) => {
                event.preventDefault();
                loadBooking();
              }}
            >
              <label htmlFor="booking-reference">Booking reference</label>

              <div>
                <input
                  id="booking-reference"
                  value={searchRef}
                  onChange={(event) => setSearchRef(event.target.value)}
                  placeholder="ORD-2026-4159"
                />

                <button type="submit" disabled={workflowLoading}>
                  {workflowLoading ? "Searching…" : "Find booking"}
                </button>
              </div>
            </form>

            {workflowError && (
              <div className="message error-message" role="alert">
                {workflowError}
              </div>
            )}

            {notice && (
              <div className="message success-message" role="status">
                {notice}
              </div>
            )}

            {booking && (
              <div className="workflow-layout">
                <section className="booking-overview">
                  <div className="booking-card-header">
                    <div>
                      <span className="reference-label">Booking reference</span>
                      <h2>{booking.bookingRef}</h2>
                    </div>

                    <span
                      className={`status-badge status-${booking.status.toLowerCase()}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  <dl className="detail-grid">
                    <div>
                      <dt>Customer</dt>
                      <dd>{booking.customerFullName}</dd>
                    </div>

                    <div>
                      <dt>Customer ID</dt>
                      <dd>{booking.customerId}</dd>
                    </div>

                    <div>
                      <dt>Service</dt>
                      <dd>{booking.serviceName}</dd>
                    </div>

                    <div>
                      <dt>Preferred date</dt>
                      <dd>{formatDate(booking.preferredServiceDate)}</dd>
                    </div>

                    <div>
                      <dt>Scheduled time</dt>
                      <dd>{formatDateTime(booking.scheduledAt)}</dd>
                    </div>

                    <div>
                      <dt>Estimated duration</dt>
                      <dd>
                        {booking.estimatedDurationMinutes
                          ? `${booking.estimatedDurationMinutes} minutes`
                          : "Not recorded"}
                      </dd>
                    </div>

                    <div>
                      <dt>Estimated fee</dt>
                      <dd>{formatMoney(booking.estimatedServiceFee)}</dd>
                    </div>

                    <div>
                      <dt>Assigned Technicians</dt>
                      <dd>
                        {booking.technicians?.length
                          ? booking.technicians
                              .map(
                                (technician) =>
                                  `${technician.fullName} (${technician.technicianId})`,
                              )
                              .join(", ")
                          : "Not assigned"}
                      </dd>
                    </div>
                  </dl>

                  {booking.status === "COMPLETED" && (
                    <div className="cost-summary">
                      <div>
                        <span>Service fee</span>
                        <strong>
                          {formatMoney(booking.completedServiceFee)}
                        </strong>
                      </div>

                      <div>
                        <span>Material cost</span>
                        <strong>{formatMoney(booking.materialCost)}</strong>
                      </div>

                      <div>
                        <span>Total cost</span>
                        <strong>{formatMoney(booking.totalCost)}</strong>
                      </div>
                    </div>
                  )}
                </section>

                <section className="transition-panel">
                  {booking.status === "CREATED" && (
                    <form onSubmit={handleConfirmation}>
                      <p className="eyebrow">Next transition</p>
                      <h2>Confirm booking</h2>

                      <label>
                        Estimated service fee (VND)
                        <input
                          type="number"
                          min="1"
                          required
                          value={estimatedServiceFee}
                          onChange={(event) =>
                            setEstimatedServiceFee(event.target.value)
                          }
                        />
                      </label>

                      <label>
                        Estimated duration (minutes)
                        <input
                          type="number"
                          min="1"
                          required
                          value={estimatedDurationMinutes}
                          onChange={(event) =>
                            setEstimatedDurationMinutes(event.target.value)
                          }
                        />
                      </label>

                      <button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Confirming…" : "Confirm booking"}
                      </button>
                    </form>
                  )}

                  {booking.status === "CONFIRMED" && (
                    <form onSubmit={handleScheduling}>
                      <p className="eyebrow">Next transition</p>
                      <h2>Schedule booking</h2>

                      <label>
                        Scheduled date and time
                        <input
                          type="datetime-local"
                          required
                          value={scheduledAt}
                          onChange={(event) =>
                            setScheduledAt(event.target.value)
                          }
                        />
                      </label>

                      <fieldset>
                        <legend>Assign Technicians</legend>

                        {SEEDED_TECHNICIANS.map((technician) => (
                          <label
                            className="technician-option"
                            key={technician.technicianId}
                          >
                            <input
                              type="checkbox"
                              checked={technicianIds.includes(
                                technician.technicianId,
                              )}
                              onChange={() =>
                                handleTechnicianChange(technician.technicianId)
                              }
                            />

                            <span>
                              <strong>{technician.fullName}</strong>
                              <small>{technician.technicianId}</small>
                            </span>
                          </label>
                        ))}
                      </fieldset>

                      <button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Scheduling…" : "Schedule booking"}
                      </button>
                    </form>
                  )}

                  {booking.status === "SCHEDULED" && (
                    <form onSubmit={handleCompletion}>
                      <p className="eyebrow">Next transition</p>
                      <h2>Complete booking</h2>

                      <label>
                        Completed service fee (VND)
                        <input
                          type="number"
                          min="1"
                          required
                          value={completedServiceFee}
                          onChange={(event) =>
                            setCompletedServiceFee(event.target.value)
                          }
                        />
                      </label>

                      <label>
                        Material cost (VND)
                        <input
                          type="number"
                          min="0"
                          required
                          value={materialCost}
                          onChange={(event) =>
                            setMaterialCost(event.target.value)
                          }
                        />
                      </label>

                      <button type="submit" disabled={actionLoading}>
                        {actionLoading ? "Completing…" : "Complete booking"}
                      </button>
                    </form>
                  )}

                  {booking.status === "COMPLETED" && (
                    <div className="completed-panel">
                      <p className="eyebrow">Workflow complete</p>
                      <h2>Service completed</h2>
                      <p>
                        This booking has completed the committed SMT workflow.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
