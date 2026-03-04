
对话接口---图片生成
```
fetch("https://chat.qwen.ai/api/v2/chat/completions?chat_id=b9234626-da4a-4b65-b12b-1df27daa39f8", {
  "headers": {
    "accept": "application/json",
    "accept-language": "zh-CN,zh;q=0.9",
    "bx-ua": "231!9pE3K4mUBzD+joOAK5gCZ48FEl2ZWfPwIPF92lBLek2KxVW/XJ2EwruCiDOX5Px4EXNhmh6EfS9eDwQGRwijIK64A4nPqeLysJcDjUACje/H3J4ZgGZpicG6K8AkiGGBTy2jws7Q+iSU6+M5Sr2nhdTZYQJc/5iDkQsOUcC2uxY+gX/wWKMx3km+0Q3oyE+jauHhUlK48RxGHkE+++3+qCS4+ItNxk6Rm3TCo+4omUdj6xBMsKOjCbSYSda6V8lB3yz0Q+aKCgGLZW7UVRFfrIgKJSkt9oK31Lp20t7WrOMnribfl57CX4zIAtEnZjir5ZJP8s59VPIynL//CI/Hq/lQtATfU7LGHhpmOrYh3+PeDuVoixLn3pgTjQAVl6C1ZCN3St7A+kdOwhaKgJ+ULSPNduyG4Qa4Mf7YBZ83HQ9aSqHq2t5aXuEeJiyGKncpomhEJvRLBdVB/IODn/cC+lVfGxV/tlcu/c1IaCoVbZ0EMctgtDXKC5d6qqicCM+jcYOF5Vdp1F/8/pro/IqGZnkM9MdVHG5J/u5IDeuM0NCW+f9+C6IdnEZmSAX+0oRMtjh6wz8IwXo8JuXhYAbU50S5Yav9kVG0RVQ1VWiqIdAVdKyj1Lk60AyBfNS/n4PRsMpV7xlQchg+8UCKguXyETzJtTdEc/jr2eKPj3D63u+ikH++CbyGDqF+4whKP2dlGvICSQshff7fKGvLksDG4pTfWenxkql4OThpZctPtGrFHHeod51ACv7TUNcV9CMkQXC5YCLhBTmwrxF5Z5+dBeBbY3F7lb0Kc9Abfm3uTA58MD75e8YRsOON5e4kv8yjJ8IBcyznvYEe9u7K8O4TCUXx4neQD84IyRjsjIOg/NkQynGhDcY3PT9BiTxvDWsE368Gu0b1tSNqR4rURnZfkvcxcZB16ygg5BQ2WpOuSl4JIy9zFDEwpQ3ivr2qTRxspNCplXnOCo+EPIcajfJ0xPY5G9Vhf8LuYO+bWNDynIoQqePTKli60UfwJ8pbL//CTXrd44nn8usBiWqQz9/LIuFN2cWwAfZfZ5wjARChKU31g5qWGkC/OvFInOdDVqXkEAGHmcM0Su71tT1Nf99xhiIZyse7MsZ5YDs4QRPNDDe3pE7U4FEkkjS3HXJCNnTSLE1dCLinwgx6aHHu61orjL8jqrlCebtEmdIbAu/tLLZtx5WKELiUhZYqSNZt2jK2Aa0rv9IdFBIQVVXpX0reLdSmfaLOu994a8Ps+xY3miG9lcdPuFY72HmfjkzjKM+lLfrDp7OPKA29g5axfUbXXIjzeZ//GU678DH1AuPYLCIFJGvVLkGiAoIwBy6LBewbCdpBLkFQMOCEvCrchRsreZXNVGPitzacu84Zq0rlhOzGiCHi+aYMdpoUS6X3fYgrHytdtRzKF0KkjkHL+6X1i1Np6BH8vGz74hVE9zCT4hHjrFHT7xfeeo6nKxP5LRlvstDnOELRGuqZDI4d8FySfoA2VlGwf9KD8die1YpMRlBPWABEDkipdBX7vD6jWucZxELRBvS=",
    "bx-umidtoken": "T2gAVrmvhlAACH_GKMjBxJYld5hhNlVCT0JK-uuJVrk6Als01ux4osYsi5vIvWL_tWs=",
    "bx-v": "2.5.36",
    "content-type": "application/json",
    "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "source": "web",
    "timezone": "Wed Mar 04 2026 17:24:38 GMT+0800",
    "x-accel-buffering": "no",
    "x-request-id": "ef27f78a-ded4-4df2-8897-9437c7f9e9c2",
    "cookie": "_gcl_au=1.1.2040236964.1771812821; _bl_uid=32m7bl3LyUsj2klkUwgec8L7b14p; cna=26UiIj2An1ICAWgcmKtujklv; x-ap=cn-hongkong; sca=b1e049e0; xlly_s=1; atpsida=1cada7191608c32909f98fa2_1772616280_1; acw_tc=0a03e59217726162810367248e4444f1a383d80119014304e87b8c7276a9f6; tfstk=gQyqpTZ4JtB2Zj_3YkDNLUbR4WMxhA7CQRgsjlqicq0ckRMZj4rwlSZ_jAWZrP30lmsxScDYFS9slZHajyMNRw6CdoEx6AbCRNUQYgknbE0M5fXorAiNr4xzxoExB3QYjMZYDO7HcC3iIPDorcomIF0gSYmox4vmjKmMrgotrAYijdYuqciwSK4iIgroycDimPcc4u0-jA0iac3iRLoEiivJFySvEdBZRo0yId2cB-0e24i-m8oqg22nzdm7Umlq-oy3MUfKq8wrObt1PYqLNrmrLTOmKuPg8W4OOQH4jS4tarQJa4NuHl0iwhvQ4fu4Z-cyjdqu2qca_r72MqVbzXnoZhWKVyguD-VPXUq0Rqkmqb6hYucgN-hLhavqKWEjh54OOQH4jSDP4lYtqYIuBS8M_jm-42sP4hY4_mxhriQB6ChYw0uCDid96jm-42sP4CdtMYnrRiIA.; isg=BM7OnBhWK54u1Z-Gn17X9JtHH6SQT5JJuxUPKvgWvVGMW2m1Md9IWFFdk4c3m4ph; ssxmod_itna=1-Yq0xyQ0QDQING0D2DRxQKhDAx7weWu4iODzxCvYG7DuxiK08D6QDBb46eHdEnwHUheami8GmelD05YbDnqD82DQeDvYPTqhPlB7725ibFt0DP_Gb0ooxt8bfOhSGdbbvt84LglOgvnLuEUSBOdDU4GnD06eKGdbDYYfDBYD74G_DDeDih3Dj4GmDGANseDF0nTroPToPxDwDB=Dmu4r0eDEDG3D04ux_kh=HDDlF0BPm0aiDYPQqZiOP24DAdhipi4Qx0UaDBLNSt7DGuk0HBni6KMpTbb7hPGuDG=kVQrdAOuW5Z2poh2m0Ybjp4i4/CeoiD3DvnAxzihNix30hxAx37Dq/LilxtnDzi4Qbm6DGIKAoVPonitYhM_5Z0mZ05oYDNRw1enFbD4SY5NDPBx4DStuxOt05C7evAKi058meYYPeD; ssxmod_itna2=1-Yq0xyQ0QDQING0D2DRxQKhDAx7weWu4iODzxCvYG7DuxiK08D6QDBb46eHdEnwHUheami8GmemDneEPm7SChINe/AYxD/FYO2GLbQS1hyGzcmp0OtOug1G8oblI0Gl91hvpRkB2NIauD_oxx==GK=rxoo9uDlBTtq70xsA2T=cexljGDD",
    "Referer": "https://chat.qwen.ai/c/guest"
  },
  "body": "{\"stream\":true,\"version\":\"2.1\",\"incremental_output\":true,\"chat_id\":\"b9234626-da4a-4b65-b12b-1df27daa39f8\",\"chat_mode\":\"guest\",\"model\":\"qwen3.5-plus\",\"parent_id\":null,\"messages\":[{\"fid\":\"d8105dec-7f8a-4ae7-8599-8216c5f5bab0\",\"parentId\":null,\"childrenIds\":[\"83a33d9b-cad0-4360-b53f-fcd69c343d39\"],\"role\":\"user\",\"content\":\"生成两张熊猫的图片\",\"user_action\":\"chat\",\"files\":[],\"timestamp\":1772616278,\"models\":[\"qwen3.5-plus\"],\"chat_type\":\"t2i\",\"feature_config\":{\"thinking_enabled\":true,\"output_schema\":\"phase\",\"research_mode\":\"normal\",\"auto_thinking\":true,\"thinking_format\":\"summary\",\"auto_search\":true},\"extra\":{\"meta\":{\"subChatType\":\"t2i\"}},\"sub_chat_type\":\"t2i\",\"parent_id\":null}],\"timestamp\":1772616278,\"size\":\"16:9\"}",
  "method": "POST"
});
```

对话接口---图片生成 ---返回的数据
```
data: {"response.created":{"chat_id": "b9234626-da4a-4b65-b12b-1df27daa39f8", "parent_id": "5ae4f464-5d27-4de6-8ddb-ca0b34525dfe", "response_id":"8a14f168-ea9b-454c-85c2-a6aa32e8c4eb"}} 

data: {"response.info": {"action": "keep_alive", "chat_id": "b9234626-da4a-4b65-b12b-1df27daa39f8", "response_id": "8a14f168-ea9b-454c-85c2-a6aa32e8c4eb", "timestamp": 1772616291}}

data: {"response.info": {"action": "keep_alive", "chat_id": "b9234626-da4a-4b65-b12b-1df27daa39f8", "response_id": "8a14f168-ea9b-454c-85c2-a6aa32e8c4eb", "timestamp": 1772616301}}

data: {"choices": [{"delta": {"role": "assistant", "content": "https://cdn.qwenlm.ai/output/wV15g699bb7dc6dbf5d57001812decaa7/t2i/8a14f168-ea9b-454c-85c2-a6aa32e8c4eb/177261631184e8.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoid1YxNWc2OTliYjdkYzZkYmY1ZDU3MDAxODEyZGVjYWE3IiwicmVzb3VyY2VfaWQiOiIxNzcyNjE2MzExODRlOCIsInJlc291cmNlX2NoYXRfaWQiOiJiOTIzNDYyNi1kYTRhLTRiNjUtYjEyYi0xZGYyN2RhYTM5ZjgifQ.u9dKGlCL6tafagTOEZex_Xk6RE5fM7ra8h2KfV-d4s8", "phase": "image_gen", "extra": {"output_image_hw": [[1536, 2688]]}, "status": "typing"}}], "response_id": "8a14f168-ea9b-454c-85c2-a6aa32e8c4eb", "usage": {"input_tokens": 0, "output_tokens": 0, "characters": 0, "width": 2688, "image_count": 1, "height": 1536}, "timestamp": 1772616312}

data: {"choices": [{"delta": {"role": "assistant", "content": "https://cdn.qwenlm.ai/output/wV15g699bb7dc6dbf5d57001812decaa7/t2i/8a14f168-ea9b-454c-85c2-a6aa32e8c4eb/177261631200a1.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoid1YxNWc2OTliYjdkYzZkYmY1ZDU3MDAxODEyZGVjYWE3IiwicmVzb3VyY2VfaWQiOiIxNzcyNjE2MzEyMDBhMSIsInJlc291cmNlX2NoYXRfaWQiOiJiOTIzNDYyNi1kYTRhLTRiNjUtYjEyYi0xZGYyN2RhYTM5ZjgifQ.ErwBq8t944ICPJgL7KAfsxoOUJBpGTnR9lTqL6WMpz0", "phase": "image_gen", "extra": {"output_image_hw": [[1536, 2688]]}, "status": "typing"}}], "response_id": "8a14f168-ea9b-454c-85c2-a6aa32e8c4eb", "usage": {"input_tokens": 0, "output_tokens": 0, "characters": 0, "width": 2688, "image_count": 1, "height": 1536}, "timestamp": 1772616313}

data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished", "phase": "image_gen"}}], "response_id": "8a14f168-ea9b-454c-85c2-a6aa32e8c4eb"}


```

对话接口---图片生成---连续对话

```
fetch("https://chat.qwen.ai/api/v2/chat/completions?chat_id=b9234626-da4a-4b65-b12b-1df27daa39f8", {
  "headers": {
    "accept": "application/json",
    "accept-language": "zh-CN,zh;q=0.9",
    "bx-ua": "231!7LB3akmUZnv+jm2vK5gCZ48FEl2ZWfPwIPF92lBLek2KxVW/XJ2EwruCiDOX5Px4EXNhmh6EfS9eDwQGRwijIK64A4nPqeLysJcDjUACje/H3J4ZgGZpicG6K8AkiGGBTy2jws7Q+iSU6+M5Sr2nhdTZYQJc/5iDkQsOUcC2uxY+gX/wWKMx3km+0Q3oyE+jauHhUlK48RxGHkE+++3+qCS4+ItNgAV617tso+4omUdj6xBMsKOjCbSYSda6V8iQNK2d3yFgMvfBUYaT9vgCoeyhKwlxpTvtno/iEn2XhlpURjVJto6jkcWM1X9IEJ4QhwzEsnRE7jcMXzdlNU3/aATSJczHasVy7ZHXgI6qD7bXw/uVb6YTB817t38heA8ekAGTgPlUEqluwYB5PTlFhuWol+vdapOiZfQyoNbltX+WuW18FSfAv075tuQ8L/G4Jp+bj8v1EkvCTryuGYwX7EF1u95/uVEqEO5rN/c3m10yaeO8Lle2PCqrMKkPOjLpmHwDeQA9/pikEBA19ifmt+TlqHpDdbTCBqx2RekYB78SfVfYihD7IlaW2qoapsLcnvPsFmFRrVDIIN510SVBjNVLG0Y5TVid52pf6zSffvWUXyYcKeHLgnwmV8gXoW/KZ2gGX8l24TtfIE3jCiRWTYzbANOfarEV66Q6qXOgLzC2aZN99wBvykjLKm3/cwwceAJixFl6D69mpNtq8pqZUugwIojFY834VoXhFnhSY67p21cj/KnSvSXoP/m1M6BjyX+8pgen5JJj2GQUh/JyRP5rVeGYq53DQF7oo/aCpEY+EXsQVMpttkL2/drKz/oxQW0xPgPWnWQq9YG3twbImV5fjL9iOgRVxmD+8UNAMRHtxCET41PI7N8k4iUSyKOoLwG8DKveg5Ih/cp6I5QzJgVFIVtYkIkijui+D7W/YL4tilUbjEfd4Z5iLPj/ih5xNkhuZb17W17a36pvUNVmqeUMKPmqr/Eb7VEY2hUYHrr1N9YyNuaerzF4uhNOnicAYdVzjEYrHc16OU0+N/ebgWtWpkC7KdmkCLxMX0jMH8X85OVRM30hoK3O1GwMPbkuU8yl9BHmv4YVeFEwNJ4Eo3+kLZVo4xGUbso6xzmgnPvo8bVH3VH5LQeQS1J87ulbyZLjLP5v6TzfTeRDciBatFCNnnaMXx4LSnw5t2I80x9cJEubCMINw3vGle4Xi06biHZP+kNy0dLEvJjqcygoXnOl5K4b3MFzdseqtISri5cDf1z/wclm0lAzd7xmCwe9pZ/VTk6Zt9DipoUfWxjeALi1+6S1YJIVbcFPdW7wqmY7eeXU7POLd3nRzVxxP56De9nACZS+kCUj6/ClI3dm1o6Ug1NOXbx625umoFH/PgLB+qpjU656HosXfjNgJIKuxb17FXcSlK/8429++PuN0b0iTBTX5PDEo9q67k2/mZx7da2Wco502FwQSGgFOiia9HIHQfXA1jpFIo1wzsjLzE6/tEUssL6m9yOEEB2vnJb4LMJyZFA/6F5ddbeqFQqovhT5cg7GQTHGuFUfFlyI7Ayv4nxUm5Ms2mvUxlvCa2BIr1BPer6P9JiaAjsJALR0kCMRM6AlHQ+NdnE7Na9yEzFhg/CouMhMzGO0qAV58DE41C3UDd//oK7CKAaCSkbP+QJWtI8S",
    "bx-umidtoken": "T2gAVrmvhlAACH_GKMjBxJYld5hhNlVCT0JK-uuJVrk6Als01ux4osYsi5vIvWL_tWs=",
    "bx-v": "2.5.36",
    "content-type": "application/json",
    "sec-ch-ua": "\"Not:A-Brand\";v=\"99\", \"Google Chrome\";v=\"145\", \"Chromium\";v=\"145\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"Windows\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "source": "web",
    "timezone": "Wed Mar 04 2026 17:26:27 GMT+0800",
    "x-accel-buffering": "no",
    "x-request-id": "b5ce102b-da92-4fa6-b3d5-2d07de440063",
    "cookie": "_gcl_au=1.1.2040236964.1771812821; _bl_uid=32m7bl3LyUsj2klkUwgec8L7b14p; cna=26UiIj2An1ICAWgcmKtujklv; x-ap=cn-hongkong; sca=b1e049e0; xlly_s=1; acw_tc=0a03e59217726162810367248e4444f1a383d80119014304e87b8c7276a9f6; atpsida=1cada7191608c32909f98fa2_1772616281_2; tfstk=gtKSLD2ea7VSXMH-97k41oB7frsCAxoaOJ6pIpEzpgIROJOeBwBz4YYBlBR5w3SJ4kEBpddC-YfF96OepUkqbcJkEMjdOfoZb9tStsd72_QKpSBFQxW-DiKe5MjK_jokJzxcxQOYQjQpHx6FK9eJ9aUADsXQwWddwZFACOjd9BdLHrBlI6BRykCxh9fY2yddwxsAi9sd9BIKhKH16j6mP_pSdd0Tw5muZ5f0vkKfFZ3VcsKkbvWGPXpFakev0TNG6LCbvk1tTjy2hLl7jKSkfC6wamEW1dxDGtdtAjsHiedddIngTgYwZhbXnVEvng1cWeQje0pfV__13Ze_kgTpZH_kPJDMHgdDS1b-ojXX4h7CsZNxwKJfwNTBajqdaF9vGN-4glSHiedddIF54mZN1mb_R-_gAt1Zhxa3-GXWB69T37wVytX2bxMbNybRnt1Zhxa3-aBc3Nkjh7ah.; isg=BAgI6xJI9YwExhk0xXC5xgEB2XYasWy7URMJOMK_3wNTnaYHH8BwSVLbFXXt9SST; ssxmod_itna=1-Yq0xyQ0QDQING0D2DRxQKhDAx7weWu4iODzxCvYG7DuxiK08D6QDBb46eHdEnwHUheami80vxlD05YbDnqD82DQeDvYPTqhPlB7725ibFt0DP_Gb0ooxt8b/h4hmxHmjz1nROVOgvnLu2tMBOdDU4GnD06ei35bDYYfDBYD74G_DDeDih3Dj4GmDGANseDF0nTroPToPxDwDB=Dmu4r0eDEDG3D04uxFGwP9CxD0khwHi4HxxGW0QnqpaedDGUe4a4o0eDMFxGX/0khxDUXqshTqZSjOtoohPFDtqD9jZue6GI=T1n5OIeKpeKr_6WDb05oYe4ix=jGnAxzixBixtQD=ixqC0sP_NejQbe30q4b4DnnYdBFnGwzvlf5IUH/YxxBhCUwG9b4ii0SBx4OPbDNlrtbiNMBxEDPcD4t4h34PeD; ssxmod_itna2=1-Yq0xyQ0QDQING0D2DRxQKhDAx7weWu4iODzxCvYG7DuxiK08D6QDBb46eHdEnwHUheami80vxmDneEPm7SChINetIYxD/FYO2GLbKY2M4XxZfodxnCRIuMGcb4dohxX7V9=zF30wd5kWqQIeenW48GehllxNWmDN/mT45i25ClWT=x4NCYD",
    "Referer": "https://chat.qwen.ai/c/guest"
  },
  "body": "{\"stream\":true,\"version\":\"2.1\",\"incremental_output\":true,\"chat_id\":\"b9234626-da4a-4b65-b12b-1df27daa39f8\",\"chat_mode\":\"guest\",\"model\":\"qwen3.5-plus\",\"parent_id\":\"8a14f168-ea9b-454c-85c2-a6aa32e8c4eb\",\"messages\":[{\"fid\":\"5ca1f45b-90e8-411c-8d2a-91f5c3b96f34\",\"parentId\":\"8a14f168-ea9b-454c-85c2-a6aa32e8c4eb\",\"childrenIds\":[\"a1213e06-9e4b-4066-be54-0072da6d0a55\"],\"role\":\"user\",\"content\":\"左边的熊猫在吃东西\",\"user_action\":\"chat\",\"files\":[{\"type\":\"image\",\"name\":\"example.png\",\"file_type\":\"image/png\",\"showType\":\"image\",\"file_class\":\"vision\",\"status\":\"uploaded\",\"url\":\"https://cdn.qwenlm.ai/output/wV15g699bb7dc6dbf5d57001812decaa7/t2i/8a14f168-ea9b-454c-85c2-a6aa32e8c4eb/177261631200a1.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoid1YxNWc2OTliYjdkYzZkYmY1ZDU3MDAxODEyZGVjYWE3IiwicmVzb3VyY2VfaWQiOiIxNzcyNjE2MzEyMDBhMSIsInJlc291cmNlX2NoYXRfaWQiOiJiOTIzNDYyNi1kYTRhLTRiNjUtYjEyYi0xZGYyN2RhYTM5ZjgifQ.ErwBq8t944ICPJgL7KAfsxoOUJBpGTnR9lTqL6WMpz0\"}],\"timestamp\":1772616387,\"models\":[\"qwen3.5-plus\"],\"chat_type\":\"t2i\",\"feature_config\":{\"thinking_enabled\":true,\"output_schema\":\"phase\",\"research_mode\":\"normal\",\"auto_thinking\":true,\"thinking_format\":\"summary\",\"auto_search\":true},\"extra\":{\"meta\":{\"subChatType\":\"t2i\"}},\"sub_chat_type\":\"t2i\",\"parent_id\":\"8a14f168-ea9b-454c-85c2-a6aa32e8c4eb\"}],\"timestamp\":1772616387,\"size\":\"16:9\"}",
  "method": "POST"
});
```

对话接口---图片生成---连续对话---返回的数据
```
data: {"response.created":{"chat_id": "b9234626-da4a-4b65-b12b-1df27daa39f8", "parent_id": "60373ffa-9039-4347-89d7-96eab44aa81e", "response_id":"499ac77e-ed85-4385-a03d-e9a9bc610eea"}} 

data: {"response.info": {"action": "keep_alive", "chat_id": "b9234626-da4a-4b65-b12b-1df27daa39f8", "response_id": "499ac77e-ed85-4385-a03d-e9a9bc610eea", "timestamp": 1772616401}}

data: {"response.info": {"action": "keep_alive", "chat_id": "b9234626-da4a-4b65-b12b-1df27daa39f8", "response_id": "499ac77e-ed85-4385-a03d-e9a9bc610eea", "timestamp": 1772616411}}

data: {"choices": [{"delta": {"role": "assistant", "content": "https://cdn.qwenlm.ai/output/wV15g699bb7dc6dbf5d57001812decaa7/t2i/499ac77e-ed85-4385-a03d-e9a9bc610eea/17726164125767.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoid1YxNWc2OTliYjdkYzZkYmY1ZDU3MDAxODEyZGVjYWE3IiwicmVzb3VyY2VfaWQiOiIxNzcyNjE2NDEyNTc2NyIsInJlc291cmNlX2NoYXRfaWQiOiJiOTIzNDYyNi1kYTRhLTRiNjUtYjEyYi0xZGYyN2RhYTM5ZjgifQ.JUG3Z5v7eMr0maB9W3Pl_TNTzP28an_NVo2FTZHMxJA", "phase": "image_gen", "extra": {"output_image_hw": [[768, 1344]]}, "status": "typing"}}], "response_id": "499ac77e-ed85-4385-a03d-e9a9bc610eea", "usage": {"input_tokens": 0, "output_tokens": 0, "characters": 0, "width": 1344, "image_count": 1, "height": 768}, "timestamp": 1772616412}

data: {"choices": [{"delta": {"role": "assistant", "content": "https://cdn.qwenlm.ai/output/wV15g699bb7dc6dbf5d57001812decaa7/t2i/499ac77e-ed85-4385-a03d-e9a9bc610eea/1772616413a193.png?key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyZXNvdXJjZV91c2VyX2lkIjoid1YxNWc2OTliYjdkYzZkYmY1ZDU3MDAxODEyZGVjYWE3IiwicmVzb3VyY2VfaWQiOiIxNzcyNjE2NDEzYTE5MyIsInJlc291cmNlX2NoYXRfaWQiOiJiOTIzNDYyNi1kYTRhLTRiNjUtYjEyYi0xZGYyN2RhYTM5ZjgifQ.voqhMd4gOpyUIBynjUyd9tvcb6YRxh1IQXKWJSZNN3w", "phase": "image_gen", "extra": {"output_image_hw": [[768, 1344]]}, "status": "typing"}}], "response_id": "499ac77e-ed85-4385-a03d-e9a9bc610eea", "usage": {"input_tokens": 0, "output_tokens": 0, "characters": 0, "width": 1344, "image_count": 1, "height": 768}, "timestamp": 1772616413}

data: {"choices": [{"delta": {"content": "", "role": "assistant", "status": "finished", "phase": "image_gen"}}], "response_id": "499ac77e-ed85-4385-a03d-e9a9bc610eea"}


```