# ADR-001 — Local-first prototype with disabled integration ports


- Status: PROPOSED
- Owner: Bos Cyo
- Change ID: MAXI-POS-001


Decision: implement v0.1.0 as a dependency-free browser application. Barcode hardware and Accounting connectivity are ports with no active adapters. No shared event, mapping, API, or cross-database write is introduced.


Reason: the requested spaces can be made explicit while the required central contracts and hardware module remain undecided.


Compatibility: additive new program; Program Ikan remains unchanged.


Recovery: remove the new artifact or reset its namespaced local snapshot.


Approval bureaucracy: INACTIVE by Bos Cyo directive. Elle architecture review is advisory and non-blocking; explicit contracts and technical gates remain active for shared integration work.
