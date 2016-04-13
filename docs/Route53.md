#Route53

Like the rest of the servo suite, `servo-gateway` should be added to the same Route53 Hosted Zone that is used for `servo-core`.

Since there will only ever be one `servo-gateway` per region, it is good practice to add entries such as `virginia.[HOSTED_ZONE].com`. The DNS entry should point to the ELB of the deployed stack. 
