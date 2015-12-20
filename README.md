# Notes about elasticsearch queries [Book to download](http://it-ebooks.info/book/4869/)

![Structure](https://github.com/heron2014/databases-workshop/blob/master/elasticsearch/img/es_structure.png)

### Data in Elasticsearch can be divided into two types:

* **exact values** (date, user ID but also exact strings such as username or email),eg,
  Foo is not the same as foo.

  Exact values are easy to query, either matches the query or it doesn't. 

* **full text** (textual data, but also reffered as unstructured data such as body of the email or text of the tweet)

  Querying full-text data is much more subtle. We are not just asking, “Does this docu‐
ment match the query” but “How well does this document match the query?” or "Hoe relevant is this document to given query?"

**So how ES understands the full-text query?**

Elasticsearch first **analyzes** the text, and then uses the results to build an **inverted index**.

#### What is inverted index and what is analysis? 

**Inverted index** is the list of all unique words that appear in any document, and for each word, a list of the documents in which it appears. 

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

What if we want to search for 'Quick' as opposed to 'quick'? Our search would fail because we don't have exact value Quick. 

To fix that problem we need to apply normalization rules to our query string, which is called **analysis**.

Normalizing these unique terms is some sort of transformation into standard form to improve searchablity. So in other words we can say that **analysis** is how full text is processed to make it searchable.

To do that job we need **analyzers**. You need to understand **when analyzers are used** to be able to get the best search results.

### When analyzers are used?

* when you query a full-text field, the query will apply analyzer to the query string as default

* when you query an exact-value field, the query will NOT analyze the query string, but instead search for the exact value that you have specified

Example: 

Let's say we query a date: 2014-10-13

* if you query on full-text field, the analysis process will convert that date into 3 terms/tokens: 2014 | 10 | 13. 
Your results that way might match more documents than you have expected.

* if you query on an exact-value fields e.g date, you will match 1 document which has exact value: 2014-10-13, but if you query only 2014 you will get 0 results.


You can also specified different type of analyzer which suits your search query. 

**Elasticsearch has two types of analyzers:** 

* **built-in analyzers (page 84) or [here](https://www.elastic.co/guide/en/elasticsearch/guide/current/analysis-intro.html#_built_in_analyzers)**

  * standard analyzers (default) 
    It splits the text on word boundaries and removes most punctuation eg,
    Original string:
    ```"Set the shape to semi-transparent by calling set_trans(5)"```
    Standard analyzer would produce:
    ```set, the, shape, to, semi, transparent, by, calling, set_trans, 5``` 

    Try it yourself by running:

    ```
    curl -XGET 'localhost:9200/_analyze?analyzer=standard' -d 'Text to analyze'
    ```

    Response is :

    ```
    {
     "tokens": [
        {
           "token":        "text",
           "start_offset": 0,
           "end_offset":   4,
           "type":         "<ALPHANUM>",
           "position":     1
        },
        {
           "token":        "to",
           "start_offset": 5,
           "end_offset":   7,
           "type":         "<ALPHANUM>",
           "position":     2
        },
        {
           "token":        "analyze",
           "start_offset": 8,
           "end_offset":   15,
           "type":         "<ALPHANUM>",
           "position":     3
        }
     ]
    }
    ```

    **token** is the actual term that will be stored in the index

    **position** indicates the order in which the terms appeared


  * simple analyzers
  The simple analyzer splits the text on anything that isn’t a letter, and lowercases the terms. It would produce:

  ```set, the, shape, to, semi, transparent, by, calling, set, trans```

  * whitespaces analyzers
  The whitespace analyzer splits the text on whitespace. It doesn’t lowercase.

  ```Set, the, shape, to, semi-transparent, by, calling, set_trans(5)```
  * language analyzers
  Language-specific analyzers are available for many languages.

* **custom analyzers (page 134)**

Custom analyzers gives you real power by combining character filters, tokenizers, and token filters in a configuration that suits your particular data.

You can for example:

* Strip out HTML by using the html_strip character filter
* Replace & characters with " and " , using a custom mapping character filter
* Lowercase terms, using the lowercase token filter
* Remove a custom list of stopwords, using a custom stop token filter ('the', 'a') 

and mmore, reference page 134.


### When to not use analyzers

The default value of index for a string field is analyzed. If we want to map the field as an exact value, we need to set it to not_analyzed:

```
{
    "tag": {
        "type":     "string",
        "index":    "not_analyzed"
    }
}
```

To do this, we need to first delete our old index (because it has the incorrect mapping) and create a new one with the correct mappings.

#### When this is useful?

```
curl -XGET 'localhost:9200/_analyze?analyzer=standard' -d 'we are looking for c++ in skills'

```

Standard analyzer which is passed by deafult will strip off '++' and transform the word into token : c. This way our search results will fail on 'c++'.

We still need to escape special characters [read here about special characters](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#_reserved_characters)

[How to setup a tokenizer in elasticsearch](http://stackoverflow.com/questions/15079064/how-to-setup-a-tokenizer-in-elasticsearch): 


I recommend reading chapter 6 Mapping and Analysis (pages 79-87)


### There are two forms of the search API:

#### **Query-string (light)** where we we pass the search as a URL query-string parameter, e.g

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

##### Selected query-string synatax [more here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html#query-string-syntax)

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


#### **Query DSL (domain specific language)** - uses JSON request body (rich search language)

**Query DSL** allows us to build much more complicated, robust queries.

Example of simple query DSL:

```
{
  "query" : {
    "match" : {
      "last_name" : "Smith"
    }
  }
}
```

Coming Soon









##### Multiple Query Strings

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

##### Difference between **must** and **should**?

tbc.



##### Useful commands: 

* ```_count```

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

* _mapping [more here](https://www.elastic.co/guide/en/elasticsearch/reference/current/mapping.html)

Mapping defines how a document with its fields are stored and indexed, what are the datatype for each field, and how the field should be handled by Elasticsearch. 

You can quickly check fields data types in a document by using following command:

```
curl -XGET 'http://localhost:9200/yourIndex/yourType/_mapping'
```