
Durations of sessions are calculated with 2 separate API calls.

The 1st call being an `actions_de_formation.php` call to obtain the total planned duration of the BDC.

The 2nd call will be a `creneaux.php` call list the planned sessions of the BDC.
From that list we're able to obtain the `heures_presence` of each session, allowing us to determine how many hours of the BDC has been completed.

From those 2 values, we then subtract total time by time spent to obtain the amount of time left in the BDC.
