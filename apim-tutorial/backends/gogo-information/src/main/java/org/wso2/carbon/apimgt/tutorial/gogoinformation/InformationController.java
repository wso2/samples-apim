package org.wso2.carbon.apimgt.tutorial.gogoinformation;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = { "*" })
@RequestMapping(value = "/portal", produces = { MediaType.APPLICATION_JSON_VALUE })
public class InformationController {

    @GetMapping({ "/sheds" })
    public String getShedInformation() {
        return "[\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f6393ed5a575aef75c\",\n" +
                "    \"index\": 0,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 1997,\n" +
                "    \"location\": \"143 Knickerbocker Avenue\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f63d0298eea82ecd34\",\n" +
                "    \"index\": 1,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 1994,\n" +
                "    \"location\": \"544 Abbey Court\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f63bb723c2938ae2e4\",\n" +
                "    \"index\": 2,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 2013,\n" +
                "    \"location\": \"365 Krier Place\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f6c6d2a60685a64bad\",\n" +
                "    \"index\": 3,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 1992,\n" +
                "    \"location\": \"445 Hinckley Place\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f62f8f98f3e031257e\",\n" +
                "    \"index\": 4,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 2019,\n" +
                "    \"location\": \"370 Herbert Street\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f6dba99f28c6e5562d\",\n" +
                "    \"index\": 5,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 2012,\n" +
                "    \"location\": \"996 Brightwater Court\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f605db1d0efb337de5\",\n" +
                "    \"index\": 6,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 2004,\n" +
                "    \"location\": \"615 Sutter Avenue\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f68d6c2a43a19e17d3\",\n" +
                "    \"index\": 7,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 1995,\n" +
                "    \"location\": \"934 Gerry Street\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f617d1766e5a3b831d\",\n" +
                "    \"index\": 8,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 2007,\n" +
                "    \"location\": \"723 Burnett Street\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b6f62aa248836c17e53a\",\n" +
                "    \"index\": 9,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"commenced\": 1993,\n" +
                "    \"location\": \"399 Leonard Street\"\n" +
                "  }\n" +
                "]";
    }

    @GetMapping({ "/platforms" })
    public String getPlatformInformation() {
        return "[\n" +
                "  {\n" +
                "    \"_id\": \"6278b82b4f501880bf2112af\",\n" +
                "    \"platformNo\": 76,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 7886,\n" +
                "    \"location\": \"Bakersville\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82b7001f8fbaeff38ec\",\n" +
                "    \"platformNo\": 96,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 9321,\n" +
                "    \"location\": \"Sunbury\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82ba2cffbd4f6bcf9c1\",\n" +
                "    \"platformNo\": 76,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 9315,\n" +
                "    \"location\": \"Smock\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82be241a2a9fbfc73b8\",\n" +
                "    \"platformNo\": 58,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 3792,\n" +
                "    \"location\": \"Vivian\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82bde4a7451a1a61d23\",\n" +
                "    \"platformNo\": 65,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 9502,\n" +
                "    \"location\": \"Shasta\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82b3f3af0176cfbbb30\",\n" +
                "    \"platformNo\": 95,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 8893,\n" +
                "    \"location\": \"Wheaton\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82ba940322af207a6eb\",\n" +
                "    \"platformNo\": 16,\n" +
                "    \"isActive\": true,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 2127,\n" +
                "    \"location\": \"Gwynn\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b82bdef9d292f94d2028\",\n" +
                "    \"platformNo\": 89,\n" +
                "    \"isActive\": false,\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"squareFt\": 7720,\n" +
                "    \"location\": \"Stockdale\"\n" +
                "  }\n" +
                "]";
    }

    @GetMapping({ "/trains" })
    public String getTrainInformation() {
        return "[\n" +
                "  {\n" +
                "    \"_id\": \"6278b55ac0beaf698a0bacc3\",\n" +
                "    \"index\": 0,\n" +
                "    \"model\": \"Phoenix \",\n" +
                "    \"isActive\": false,\n" +
                "    \"manufacturer\": \"Siemens \",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1978,\n" +
                "    \"registered\": \"1999-12-23T11:37:57 -06:00\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b55ac84a96da248d13b5\",\n" +
                "    \"index\": 1,\n" +
                "    \"model\": \"Phoenix \",\n" +
                "    \"isActive\": true,\n" +
                "    \"manufacturer\": \"lincoln\",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1951,\n" +
                "    \"registered\": \"1992-09-23T10:48:01 -06:-30\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b55a5a22b403e9d7a443\",\n" +
                "    \"index\": 2,\n" +
                "    \"model\": \"HO, N scale\",\n" +
                "    \"isActive\": true,\n" +
                "    \"manufacturer\": \"martin\",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1957,\n" +
                "    \"registered\": \"2019-11-03T03:05:24 -06:-30\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b55a58d049b45557ebc8\",\n" +
                "    \"index\": 3,\n" +
                "    \"model\": \"Phoenix \",\n" +
                "    \"isActive\": false,\n" +
                "    \"manufacturer\": \"Siemens \",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1960,\n" +
                "    \"registered\": \"2015-03-04T11:26:33 -06:-30\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b55aafbe3f7dd46acc4e\",\n" +
                "    \"index\": 4,\n" +
                "    \"model\": \"martin\",\n" +
                "    \"isActive\": false,\n" +
                "    \"manufacturer\": \"martin\",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1990,\n" +
                "    \"registered\": \"1990-07-14T01:11:12 -06:-30\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b55ab2715525d39358a3\",\n" +
                "    \"index\": 5,\n" +
                "    \"model\": \"martin\",\n" +
                "    \"isActive\": false,\n" +
                "    \"manufacturer\": \"lincoln\",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1980,\n" +
                "    \"registered\": \"1991-02-03T09:39:28 -06:-30\"\n" +
                "  },\n" +
                "  {\n" +
                "    \"_id\": \"6278b55afd6e3fa8bfa43d98\",\n" +
                "    \"index\": 6,\n" +
                "    \"model\": \"HO, N scale\",\n" +
                "    \"isActive\": true,\n" +
                "    \"manufacturer\": \"Siemens \",\n" +
                "    \"picture\": \"http://placehold.it/32x32\",\n" +
                "    \"year\": 1961,\n" +
                "    \"registered\": \"1995-08-03T02:38:11 -06:-30\"\n" +
                "  }\n" +
                "]";
    }
}