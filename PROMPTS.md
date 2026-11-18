# Development prompts and test results

## Debugging repeated model output

```text
can you see the responses of the model it is given gibberish like repeated words
```

## Continuing after the model fix

```text
perfect now it works, now what, please guide with the next steps
```

## Reviewing the updated model prompt

```text
I only changed the prompt, can you please check the response and guide with the next steps as well
```

## Verifying the rollout rule

I shared these test results to confirm the expected decisions.

```text
0. Pass — 10% increase, 12 ms limit, 0 ms above limit
1. Pass — 20% increase, 12 ms limit, 0 ms above limit
2. Hold — 50% increase, 9.6 ms limit, 2.4 ms above limit
3. Insufficient data — canary measurement missing
```

## Confirming the sample rollout UI changes

```text
done with the mentioned changes
```

## Debugging the state type

```text
Property 'sampleLoaded' does not exist on type 'ChatAgent'.ts(2339)
any
```

## Confirming the rollout recall test

```text
done, I got the expected answer
```

## Investigating conversation isolation

```text
opening in incognito did not start afresh, it has old conversation
```

```text
two urls end in different random ids in incognito and normal browsing window
```

```text
incognito did not show isolation test result conversation
```

## Requesting cleanup and submission documentation

```text
can you please prompt to clean up and what the project should have in read me etc for the job application
```
