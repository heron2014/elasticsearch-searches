# elasticsearch-searches
Advanced searches using elasticsearch

## Multiple Query Strings

If you want to perform search on two fields, e.g: name and location


```
query: {
    bool: {
        must: [

            {match: {location: request.query.location}},
            {match: {fullname: request.query.name}}
        ]
    }
}
```

**match** query lowercase and uppercase 
**term** query only exact values as in database, e.g If location: 'London' and you query london - it will not find your match
