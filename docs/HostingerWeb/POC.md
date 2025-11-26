Use Edge Function to process data from DD (Dendreo) API requests:

Current demo ADFs:

[Test Bilan de compétences (8h)](https://pro.dendreo.com/competences_et_metiers/actions_de_formation.php?id_action_de_formation=447&sous_page=creneaux)
- 1 créneau used (2h signed, 6h left)

[Bilan de compétences - Démo](https://pro.dendreo.com/competences_et_metiers/actions_de_formation.php?id_action_de_formation=124&sous_page=creneaux)

- 2 créneau created, unused 9h total

Current data processing structure for time/duration dashboard:
From `creneaux.php` response we get time spent on BDC
From `actions_de_formation.php` response we get planned duration of a BDC
We then subtract the duration by time spent to display how many time is left in the BDC.

## Webhook Integration

This is a major part of the platform structure as the website is supposed to have functions triggered by actions on DD.

### Get DD ADF ID from email

Using Dendreo's API we'll make a GET query on the `participant.php` endpoint with the `email=mail@domain.com` search parameter.

> This allows us to obtain the user's **Dendreo participant ID**

We'll then make a GET query on the `laps.php` endpoint with the `id_participant` in the search parameter.

> This returns the ADFs associated to that participant in which we'll filter all the ones that have `"categorie_module_id": "6"` in them (This means the category of the course is BDC)

We'll then store the associated ADF IDs in the user's enrollment table. 
### DD User -> Supabase data schema

We'll be using a DD Webhook for this process

When a participant is added to a module, we'll take the following infos from the message:
- ADF ID
- Module ID
- Email

Then we'll apply the following filtering logic:
If module ID is == BDC modules IDs
> Then we'll check Supabase DB if the email in the response exists to update or create the entry.
### Triggering sessions

Once a participant is added to a **programmed ADF**, we'll use a webhook to notify the user and add the session to his agenda.

Webhook to apply session date/time changes will also be necessary.

Summary of functions that webhook/s will need to cover -> webhook scope:
- Add user to a BDC -> ADF
- Notify user of BDC next session date -> ADF créneaux
- Update session date/time upon changes -> ADF créneaux
- Update presence/progression overtime -> ADF créneaux
- Close the BDC course once all sessions are completed -> ADF créneaux


## Dashboard

Display single or collective BDC sessions available

## Competencies

Contains few competencies cards that should display messages filled by the consultants.

## Calendar

Since we now obtain the ADF from the connected auth user's email.
We'll then display the planned sessions of that ADF on the calendar using all related ADF IDs.

### Objectives

Fillable form with check-boxes. Form is based on the PDF template

## V2 features
### CV Generator


### Central Test Integration (TBD)

Use the API to submit test using dest token