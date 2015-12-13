# Notes about elasticsearch queries

## ES structure

![Structure](https://github.com/heron2014/databases-workshop/blob/master/elasticsearch/img/es_structure.png)

## Data in Elasticsearch can be divided into two types:

* **exact values** (date, user ID but also exact strings such as username or email),eg,
Foo is not the same as foo 
Exact values are easy to query, either matches the query or it doesn't. 

* **full text** (textual data, but also reffered as unstructured data such as body of the email or text of the tweet)

Querying full-text data are the answers on these questions: 
"How well does this document match the query or How relevant is this document?" as opposed to "Does this docu‐
ment match the query?"

So how ES understands the full-text query?

Elasticsearch first **analyzes** the text, and then uses the results to build an **inverted index**.

### What is inverted index and what is analysis? 

Is the list of all unique words that appear in any document, and for each word, a list of the documents in which it appears. 

eg, lets say we have a field called `title` with following content:

```
The quick brown fox jumped over the lazy dog
```

We first split the title field of each document into separate words (which we call terms, or tokens)

```
The | quick | brown | fox | jumped | over | the | lazy | dog

```
then we create a sorted list of all the unique terms, and then list in which document each term appears. 

Now, if we want to search for quick brown , we just need to find the documents in
which each term appears.

What if we want to search for Quick as opposed to quick? Our search would fail because we don't have exact value Quick. 

To fix that problem we need to apply normalization rules to our query string, which is called **analysis**.

I recommend reading chapter 6 Mapping and Analysis (pages 79-87)


## There are two forms of the search API:

1. Query-string (light) where we we pass the search as a URL query-string parameter, e.g

```
GET /myIndex/myType/myPath?q=field:Smith
```
query itself in the q=parameter

#### How the query-string works?

It uses ```_all``` field (created by ES) unless another field name has been specified

```_all``` field is created by concatanating all the fields into one huge string

e.g
```
{
  "tweet": "However did I manage before Elasticsearch?",
  "date": "2014-09-14",
  "name": "Mary Jones",
  "user_id": 1
}
```

**_all** field:

```
"However did I manage before Elasticsearch? 2014-09-14 Mary Jones 1"
```

```_all``` field uses default analyzer
And like any string field, you can configure which ana‐
lyzer the _all field should use:

```
{
"my_type": {
"_all": { "analyzer": "whitespace" }
}
}
```

Note:
The ```_all``` field is useful during the exploratory phase of a new application, while you
are still unsure about the final structure that your documents will have.

But once you want more specifc resualts from your queries yu will notice using _all fields less and less. By querying individual fields, you have more flexbility, power,control of your results.

You can disable _all field :

```
{
  "my_type": { "_all": { "enabled": false }}
}
```

**_all** field can be controlled on a field-by-field basis by using **include_in_all**, which defaults to true.

Example:

To keep ```_all``` field just for specific fields, such as title, overview, summary and tags,
instead of disabling the ```_all`` field completely, disable ```include_in_all``` for all fields and enable it only for the fields you choose:

```
{
"my_type": {
  "include_in_all": false,
  "properties": {
    "title": { "type": "string",
    "include_in_all": true},
    }
  }
}
```

## Selected query-string synatax [more here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-string-syntax)

* any of the fields book.title, book.content or book.date contains quick or brown 

```
  book.\*:(quick brown)
```

* wildcards (expensive), e.g;

```
qu?ck bro*
```

```?``` replaces a single character
```*``` replaces zero or more characters

* regular expressions

```
name:/joh?n(ath[oa]n)/
```

* fuzziness (search for terms that are similar to, but not exactly like our search terms, uses **fuzzy operator**), e.g,

```
quikc~ brwn~ foks~
```
Fuzzy operator uses distance numbers (default is 2) to find all terms with a maximum of two changes, where a change is the insertion, deletion or substitution of a single character, or transposition of two adjacent characters.

```
quikc~1
```

Useful for catching human misspellings.

* proximity searches

Phrase query (eg "john smith") expects all of the terms in exactly the same order.
**Proximity** query allows the specified words to be further apart or in a different order.

Similar to fuzzy proximity uses distance numbers but not to single characters but to words.

Example:

```
"fox quick"~5
```

Maximum distance is 5, this means that, the closer the text in a field is to the original order specified in the query string, the more relevant that document is considered to be.

* ranges (can be used for dates, numeric and string fields)

  * Inclusive ranges [min TO max]
  * Exclusive ranges {min TO max}

```
age:(>=10 AND <20)
```

* boosting

Uses the boost operator ```^``` to make one term more relevant than another.

eg, we are searching for all foxes but we are most intrested in quick foxes.

```
quick^2 fox
```

 ```2``` is a boost number, default is 1, but can be any posive number. Boost number from 0 - 1 reduce relevant.

 * boolean operators

 The operators are ```+``` (this term must be present) and ```-``` (this term must not be present), rest is optional, eg,

 ```
 quick brown +fox -news
 ```

  * fox must be present
  * news must not be present
  * rest is optional, altough their presence increases the relevance 

  You can use also following operators: ```AND```, ```OR``` and ```NOT``` (also written ```&&```, ```||``` and ```!```). 

  While the ```+``` and ```-``` only affect the term to the right of the operator, ```AND``` and ```OR``` can affect the terms to the left and right. Also ```NOT``` takes precedence over ```AND```, which takes precedence over ```OR```.

Example of query rewritten using ```match query``` 

```
{
    "bool": {
        "must":     { "match": "fox"         },
        "should":   { "match": "quick brown" },
        "must_not": { "match": "news"        }
    }
}
```

* grouping and reserved characters [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_grouping)


2. Query DSL (domain specific language) - uses JSON request body (rich search language)

Example:

## Useful commands: 

### ```_count```

Count the number of documents in a cluster

```
curl -XGET 'http://localhost:9200/yourIndex/yourType/_count' -d '
  {
    "query":{
    "match_all":{}
    }
  }
'
```

### _mapping [more here](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)

Mapping defines how a document with its fields are stored and indexed. 

You can quickly check fields data types in a document by using following command:

```
curl -XGET 'http://localhost:9200/yourIndex/yourType/_mapping'
```

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

**query**
**bool** - filter
**match** - one of several types of query (matches lower and uppercases) [more](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-match-query.html) 
**term** query only exact values as in database, e.g If location: 'London' and you query london - it will not find your match

#### Difference between **must** and **should**?