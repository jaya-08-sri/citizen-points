import { activities } from "../data/mockData";

export default function EarnPoints() {
  return (
    <>
      <h1>Earn points</h1>
      <p className="muted">
        Points are added after verification. The point values below are sample values and will change after the pilot.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Activity</th>
              <th>Points</th>
              <th>Evidence needed</th>
            </tr>
          </thead>
          <tbody>
            {activities.map((a) => (
              <tr key={a.name}>
                <td>{a.name}</td>
                <td>{a.points}</td>
                <td>{a.evidence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
