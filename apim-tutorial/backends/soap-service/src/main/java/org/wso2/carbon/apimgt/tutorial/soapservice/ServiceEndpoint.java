package org.wso2.carbon.apimgt.tutorial.soapservice;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.wso2.carbon.apimgt.tutorial.GetAllMoviesResponse;
import org.wso2.carbon.apimgt.tutorial.GetAllSongAlbumsResponse;
import org.wso2.carbon.apimgt.tutorial.GetAllTVSeriesResponse;
import org.wso2.carbon.apimgt.tutorial.ListSongsByAlbumRequest;
import org.wso2.carbon.apimgt.tutorial.ListSongsByAlbumResponse;

@Endpoint
public class ServiceEndpoint {

	private static final String NAMESPACE_URI = "http://tutorial.apimgt.carbon.wso2.org";

	private ItemRepository repository;

	@Autowired
	public ServiceEndpoint(ItemRepository repository) {
		this.repository = repository;
	}

	@PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAllMovies")
	@ResponsePayload
	public GetAllMoviesResponse getAllMovies() {
		GetAllMoviesResponse resp = new GetAllMoviesResponse();
		resp.getMovieItems().addAll(repository.getAllMovies());
		return resp;

	}

	@PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAllTVSeries")
	@ResponsePayload
	public GetAllTVSeriesResponse getAllTVSeries() {
		GetAllTVSeriesResponse resp = new GetAllTVSeriesResponse();
		resp.getTvItems().addAll(repository.getAllTVSeries());
		return resp;

	}

	@PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAllSongAlbums")
	@ResponsePayload
	public GetAllSongAlbumsResponse getAllGetAllSongAlbums() {
		GetAllSongAlbumsResponse resp = new GetAllSongAlbumsResponse();
		resp.getAlbumItems().addAll(repository.getAllAlbums());
		return resp;

	}

	@PayloadRoot(namespace = NAMESPACE_URI, localPart = "listSongsByAlbumRequest")
	@ResponsePayload
	public ListSongsByAlbumResponse getSongs(@RequestPayload ListSongsByAlbumRequest request) {
		ListSongsByAlbumResponse resp = new ListSongsByAlbumResponse();
		resp.getSongItems().addAll(repository.getSongsOfAlbum(request.getAlbumName().getValue()));
		return resp;

	}

}
