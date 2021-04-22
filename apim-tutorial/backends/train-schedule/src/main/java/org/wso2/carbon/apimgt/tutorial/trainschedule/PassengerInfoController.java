package org.wso2.carbon.apimgt.tutorial.trainschedule;

import java.util.Date;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin(origins = { "*" })
@RequestMapping({ "/v1" })
public class PassengerInfoController {

	@GetMapping({ "/passenger-count" })
	public Count getCount() {
		int min = 100;
		int max = 10000;
		int count = (int) (Math.random() * (max - min + 1) + min);
		String date = new Date().toString();
		return new Count(count, date);
	}
}
