Use Edge Function to process data from DD API requests:

Current demo ADFs:

[Test Bilan de compétences (8h)](https://pro.dendreo.com/competences_et_metiers/actions_de_formation.php?id_action_de_formation=447&sous_page=creneaux)
- 1 créneau used (2h signed, 6h left)

[Bilan de compétences - Démo](https://pro.dendreo.com/competences_et_metiers/actions_de_formation.php?id_action_de_formation=124&sous_page=creneaux)

- 2 créneau created, unused 9h total

Current data processing structure for time/duration dashboard:
From `creneaux.php` response we get time spent on BDC
From `actions_de_formation.php` response we get planned duration of a BDC
We then subtract the duration by time spent to display how many time is left in the BDC.