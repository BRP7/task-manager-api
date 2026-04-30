export default function CarryForwardSection({
  selectedCount,
  onCarryAll,
  onCarrySelected,
  feedback,
  isSubmitting
}) {
  return (
    <section className="panel carry-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Carry Forward</p>
          <h2>Move unfinished work to tomorrow</h2>
        </div>
        <p className="helper-text">
          Completed tasks stay behind. Pick individual tasks or carry every unfinished item.
        </p>
      </div>

      <div className="carry-actions">
        <button className="ghost-button" type="button" onClick={onCarryAll} disabled={isSubmitting}>
          Carry All Tasks
        </button>
        <button
          className="primary-button"
          type="button"
          onClick={onCarrySelected}
          disabled={isSubmitting || selectedCount === 0}
        >
          Carry Selected
        </button>
      </div>

      <p className="selection-note">
        {selectedCount > 0
          ? `${selectedCount} task${selectedCount === 1 ? "" : "s"} selected`
          : "Select unfinished tasks from the list to enable Carry Selected."}
      </p>

      {feedback ? (
        <p className={`notice ${feedback.type === "error" ? "notice-error" : "notice-success"}`}>
          {feedback.text}
        </p>
      ) : null}
    </section>
  );
}
