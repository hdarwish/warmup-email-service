Assignment for Backend
Warmup Email Service
To protect our client's emails, we provide an email warmup service.
At the core, it runs as a microservice listening on a queue (your choice, but make it
abstract so that we can swap the implementation with little to no effort) for a
SendEmail event.
SendEmail event will have the following fields: toAddress, tenantId, userId, subject,
and body.
The service does the following once it receives an event:
- It resolves the email address to send using the combo of userId and tenantId. In a
company, each user can have an email address.
- it checks if the email can be sent based on that day's quota. Find a good scaling
strategy for email warmup for daily quotas.
- Check if the email is reachable and valid. Reject all throwaway addresses.
- It sends the email if it was sent, otherwise, puts it back into the queue with the
correct delay
- use a log for logging each state of the api process
---
Add a basic API to store credentials (note that most providers like google, have a
callback, which will have the token). Store it in a small db of choice.
A small frontend app can be made to facilitate linking an account. For the purpose of
this task, we can hard code the tenantId and userId. But there needs to be two
users, one with outlook and the other with gmail.